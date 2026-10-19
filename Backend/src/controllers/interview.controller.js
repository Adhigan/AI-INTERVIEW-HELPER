const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const {
    uploadResume,
    deleteResume
} = require("../config/azureStorage");
const {
    downloadResumeBuffer
} = require("../config/azureStorage");



async function downloadOriginalResumeController(req, res) {
    try {
        const { interviewReportId } = req.params;

        // Only find reports owned by the logged-in user.
        const report = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!report) {
            return res.status(404).json({
                message: "Interview report not found."
            });
        }

        if (!report.resumeBlobName) {
            return res.status(404).json({
                message: "No original resume is stored for this report."
            });
        }

        const pdfBuffer = await downloadResumeBuffer(
            report.resumeBlobName
        );

        const filename = (
            report.resumeOriginalName || "resume.pdf"
        ).replace(/["\r\n]/g, "_");

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition":
                `attachment; filename="${filename}"`,
            "Content-Length": pdfBuffer.length,
            "Cache-Control": "private, no-store"
        });

        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("Original resume download failed:", error.message);

        return res.status(500).json({
            message: "Failed to download the original resume."
        });
    }
}


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */

async function generateInterViewReportController(req, res) {
    let blobName = null;

    try {
        const { selfDescription, jobDescription } = req.body;

        if (!jobDescription?.trim()) {
            return res.status(400).json({
                message: "Job description is required."
            });
        }

        if (!req.file && !selfDescription?.trim()) {
            return res.status(400).json({
                message: "Please upload a resume or enter your self-description."
            });
        }

        let resumeText = "";

        if (req.file) {
            // Verify the PDF file signature (magic bytes).
            if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
                return res.status(400).json({
                    message: "The uploaded file is not a valid PDF."
                });
            }

            // 1. Store the original PDF in Azure Blob Storage.
            blobName = await uploadResume(
                req.file.buffer,
                req.file.originalname
            );

            // 2. Extract the PDF text.
            const parsed = await (
                new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))
            ).getText();

            resumeText = parsed.text;
        }

        // 3. Ask Gemini for the report.
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        // 4. Save report data and Azure file metadata in MongoDB.
        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            resumeBlobName: blobName,
            resumeOriginalName: req.file ? req.file.originalname : null,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        });

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        });

    } catch (error) {
        
        console.error(
            "Interview report generation failed:",
            error.message
        );

        // Clean up the uploaded PDF if processing or saving fails.
        if (blobName) {
            try {
                await deleteResume(blobName);
            } catch (cleanupError) {
                console.error(
                    "Azure blob cleanup failed:",
                    cleanupError.message
                );
            }
        }

        return res.status(500).json({
            message: "Failed to generate interview report."
        });
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        // Only the owner of the report may generate a PDF from it.
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        return res.send(pdfBuffer)
    } catch (error) {
        console.error("Resume PDF generation failed:", error.message)
        return res.status(500).json({
            message: "Failed to generate the resume PDF."
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController,downloadOriginalResumeController }