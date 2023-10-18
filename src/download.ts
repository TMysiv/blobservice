import { ContainerClient } from '@azure/storage-blob';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as https from "https";
import { ServerResponse } from 'http';

import {responseToClient} from './app';

export async function downloadFile(fileId: string, containerClient: ContainerClient, res: ServerResponse, accessKey?: string) {
    try {
        const blockBlobClient = await containerClient.getBlockBlobClient(fileId);
        await blockBlobClient.getProperties();

        let blobUrl = blockBlobClient.url;
        if (accessKey) {
            if (accessKey !== process.env.AZURE_STORAGE_SAS) {
                return responseToClient(400, 'File access key not valid', res);
            }
            blobUrl = `${blobUrl}?${accessKey}`;
        }

        const filePath = await generateUniqueKey();
        const file = fs.createWriteStream(`${filePath}.jpeg`);
        https.get(blobUrl, (resp) => {
            let stream = resp.pipe(file);
            stream.on('finish', async () => {
                console.log('done')
            });
        });
        await responseToClient(200, 'Successful download', res);
    } catch (e) {
        if (e.details.errorCode) {
            await responseToClient(e.statusCode, e.details.errorCode, res);
        } else {
            await responseToClient(500, 'Error downloading the file to Azure Blob Storage.', res);
        }
    }
}

async function generateUniqueKey() {
    return uuidv4();
}


