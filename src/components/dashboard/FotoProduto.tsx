import { AnimatePresence, motion } from 'framer-motion'
import { Box, Camera, Loader2, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import { useAtualizarFotoProduto } from '../../hooks/useData'
import { comprimirImagem } from '../../lib/image'
import type { Produto } from '../../types/database'
import { mensagemErro, useToast } from '../ui/Toast'

/**
 * Área da foto no card do produto: clique ou arraste uma imagem para adicionar/trocar;
 * a lixeira remove (clique duplo para confirmar). A imagem é reduzida para WebP antes do envio.
 */
export function FotoProduto({ produto }: { produto: Produto }) {
  const atualizar = useAtualizarFotoProduto()
  const notificar = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [confirmarRemocao, setConfirmarRemocao] = useState(false)
  const enviando = atualizar.isPending

  const enviar = async (f: File | undefined) => {
    if (!f) return
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return notificar('erro', 'Use uma imagem JPG, PNG ou WebP.')
    if (f.size > 15 * 1024 * 1024) return notificar('erro', 'Imagem muito grande (máx. 15 MB).')
    try {
      const foto = await comprimirImagem(f)
      await atualizar.mutateAsync({ produto, foto })
      notificar('sucesso', `Foto de "${produto.nome}" ${produto.foto_url ? 'atualizada' : 'adicionada'}.`)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  const remover = async () => {
    if (!confirmarRemocao) {
      setConfirmarRemocao(true)
      setTimeout(() => setConfirmarRemocao(false), 3000)
      return
    }
    setConfirmarRemocao(false)
    try {
      await atualizar.mutateAsync({ produto, foto: null })
      notificar('sucesso', `Foto de "${produto.nome}" removida.`)
    } catch (err) {
      notificar('erro', mensagemErro(err))
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    enviar(e.dataTransfer.files?.[0])
  }

  return (
    <div
      className="group/foto absolute inset-0"
      onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
      onDragLeave={() => setArrastando(false)}
      onDrop={onDrop}
    >
      <AnimatePresence mode="wait" initial={false}>
        {produto.foto_url ? (
          <motion.img
            key={produto.foto_url}
            src={produto.foto_url}
            alt={produto.nome}
            loading="lazy"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <motion.div key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-layers flex h-full w-full items-center justify-center text-brand-300/50">
            <Box size={44} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão que cobre a imagem: adicionar/trocar */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        aria-label={produto.foto_url ? `Trocar foto de ${produto.nome}` : `Adicionar foto a ${produto.nome}`}
        className={`absolute inset-0 flex items-center justify-center transition focus-visible:opacity-100 ${
          arrastando || enviando ? 'bg-zinc-950/60 opacity-100' : produto.foto_url ? 'bg-zinc-950/50 opacity-0 group-hover/foto:opacity-100' : 'opacity-100'
        }`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur transition ${
            produto.foto_url || arrastando || enviando
              ? 'bg-zinc-950/80 text-zinc-100'
              : 'mt-28 bg-zinc-950/60 text-zinc-300 group-hover/foto:bg-zinc-950/80 group-hover/foto:text-zinc-100'
          }`}
        >
          {enviando ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
          {enviando ? 'Enviando…' : arrastando ? 'Solte a imagem' : produto.foto_url ? 'Trocar foto' : 'Adicionar foto'}
        </span>
      </button>

      {produto.foto_url && !enviando && (
        <button
          type="button"
          onClick={remover}
          aria-label={confirmarRemocao ? 'Confirmar remoção da foto' : `Remover foto de ${produto.nome}`}
          title={confirmarRemocao ? 'Clique de novo para remover' : 'Remover foto'}
          className={`absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium backdrop-blur transition ${
            confirmarRemocao
              ? 'bg-red-500/90 text-white opacity-100'
              : 'bg-zinc-950/75 text-zinc-200 opacity-0 hover:text-red-300 focus-visible:opacity-100 group-hover/foto:opacity-100'
          }`}
        >
          <Trash2 size={13} /> {confirmarRemocao && 'Remover?'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          enviar(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
