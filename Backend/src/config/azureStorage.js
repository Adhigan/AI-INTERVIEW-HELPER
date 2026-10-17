
const {
    BlobServiceClient
} = require("@azure/storage-blob");

const connectionString =
    process.env.AZURE_STORAGE_CONNECTION_STRING;

const containerName =
    process.env.AZURE_STORAGE_CONTAINER || "resumes";

if (!connectionString) {
    throw new Error(
        "AZURE_STORAGE_CONNECTION_STRING is missing"
    );
}

const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

const containerClient =
    blobServiceClient.getContainerClient(containerName);

async function initializeStorage() {
    await containerClient.createIfNotExists();
}

async function uploadResume(buffer, originalName) {
    const crypto = require("crypto");

    const safeName = originalName.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

    const blobName =
        `${crypto.randomUUID()}-${safeName}`;

    const blobClient =
        containerClient.getBlockBlobClient(blobName);

    await blobClient.uploadData(buffer, {
        blobHTTPHeaders: {
            blobContentType: "application/pdf"
        }
    });

    return blobName;
}

async function deleteResume(blobName) {
    const blobClient =
        containerClient.getBlockBlobClient(blobName);

    await blobClient.deleteIfExists();
}



async function downloadResumeBuffer(blobName) {
    const blobClient =
        containerClient.getBlockBlobClient(blobName);

    const exists = await blobClient.exists();

    if (!exists) {
        throw new Error("Resume not found in Azure Blob Storage");
    }

    return await blobClient.downloadToBuffer();
}


module.exports = {
    initializeStorage,
    uploadResume,
    deleteResume,
    downloadResumeBuffer
};