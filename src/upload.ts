import * as fs from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import * as multiparty from 'multiparty'
import { v4 as uuidv4 } from 'uuid';
import { ContainerClient } from '@azure/storage-blob';
import { responseToClient } from './app';

export async function uploadFile(req: IncomingMessage, res: ServerResponse, containerClient: ContainerClient) {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return responseToClient(500, 'Error parsing the request.', res);
        }
        try {
            const blobName = await generateUniqueKey();
            const blockBlobClient = await containerClient.getBlockBlobClient(blobName);

            const readStream = fs.createReadStream(files.data[0].path);
            await blockBlobClient.uploadStream(
                readStream,
                parseInt(process.env.AZURE_BUFFER_SIZE),
                parseInt(process.env.AZURE_MAX_CONCURENCE),
                {
                    blobHTTPHeaders: {
                        blobContentType: 'image/jpeg'
                    }
                }
            );
            await responseToClient(200, 'File uploaded and stored.', res);
        } catch (e) {
            await responseToClient(500, 'Error uploading the file to Azure Blob Storage.', res);
        }
    });
}

async function generateUniqueKey() {
    return uuidv4();
}
