import http, { Server, IncomingMessage, ServerResponse } from 'http';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

import { uploadFile } from './upload';
import { downloadFile } from './download';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_PUBLIC_STORAGE_CONTAINER = process.env.AZURE_PUBLIC_STORAGE_CONTAINER;
const AZURE_PRIVATE_STORAGE_CONTAINER = process.env.AZURE_PRIVATE_STORAGE_CONTAINER;

const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
);
const containerPublicClient: ContainerClient = blobServiceClient.getContainerClient(AZURE_PUBLIC_STORAGE_CONTAINER);
const containerPrivateClient: ContainerClient = blobServiceClient.getContainerClient(AZURE_PRIVATE_STORAGE_CONTAINER);

const server: Server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'POST' && req.url === '/upload') {
        await uploadFile(req, res, containerPublicClient);

    } else if (req.method === 'POST' && req.url === '/upload/private'){
        await uploadFile(req, res, containerPrivateClient);

    } else if(req.method === 'GET' && req.url ) {
        const parts = req.url.split('/').filter(Boolean);
        if (parts.length === 1){
           const fileId = parts[0];
           await downloadFile(fileId, containerPublicClient, res);

        } else if (parts.length === 2) {
            const accessKey = parts[0];
            const fileId = parts[1];
            await downloadFile(fileId, containerPrivateClient, res, accessKey);

        } else {
            await responseToClient(400,'Bad request', res);
        }
    } else {
        await responseToClient(404,'Not found', res);
    }

})

export async function responseToClient(statusCode: number, message: string, res: ServerResponse) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain');
    res.end(message);
}

const port = process.env.PORT;
server.listen(port,() => {
    console.log(`Server has started on PORT ${port}`)
})
