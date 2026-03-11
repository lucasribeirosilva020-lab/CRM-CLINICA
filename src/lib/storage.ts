/**
 * Faz o upload de um arquivo para o Supabase Storage via API Proxy (servidor).
 * Desta forma evitamos erros de RLS e rede no frontend.
 * 
 * @param file O arquivo a ser enviado (File ou Blob)
 * @param path O caminho/nome do arquivo de destino (ex: 'imagens/foto.jpg').
 * @param bucket O nome do bucket. Padrão é 'crm-media'.
 * @returns A URL pública do arquivo.
 */
export async function uploadFileToStorage(
    file: File | Blob,
    path?: string,
    bucket: string = 'crm-media'
): Promise<string> {
    try {
        const formData = new FormData();
        const fileExt = file instanceof File ? file.name.split('.').pop() : 'webm';
        const finalPath = path || `${crypto.randomUUID()}.${fileExt}`;

        formData.append('file', file);
        formData.append('path', finalPath);
        formData.append('bucket', bucket);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Falha no upload via servidor');
        }

        return result.publicUrl;
    } catch (err) {
        console.error('Falha ao processar upload via proxy:', err);
        throw err;
    }
}
