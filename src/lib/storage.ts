import { getSupabase } from './supabase'

export const BUCKET_PRODUTOS = 'produtos'

/**
 * Envia a foto de um produto para o Storage.
 * As policies exigem que o arquivo fique dentro da pasta do usuário: `{user_id}/arquivo.ext`.
 */
export async function uploadFotoProduto(file: Blob) {
  const sb = getSupabase()
  const { data: auth } = await sb.auth.getUser()
  if (!auth.user) throw new Error('Faça login para enviar fotos.')

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp'
  const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await sb.storage
    .from(BUCKET_PRODUTOS)
    .upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
  if (error) throw error

  const { data } = sb.storage.from(BUCKET_PRODUTOS).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function removerFotoProduto(path: string) {
  const { error } = await getSupabase().storage.from(BUCKET_PRODUTOS).remove([path])
  if (error) throw error
}
