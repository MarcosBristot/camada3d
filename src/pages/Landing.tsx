import { motion, useScroll, useSpring } from 'framer-motion'
import { Features } from '../components/landing/Features'
import { FinalCTA } from '../components/landing/FinalCTA'
import { RodapeLegal } from '../components/legal/RodapeLegal'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { MaterialsMarquee } from '../components/landing/MaterialsMarquee'
import { Navbar } from '../components/landing/Navbar'
import { PricingPreview } from '../components/landing/PricingPreview'

export default function Landing() {
  // barra de progresso de leitura no topo
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <motion.div
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-brand-500 to-accent-300"
      />
      <Navbar />
      <main>
        <Hero />
        <MaterialsMarquee />
        <Features />
        <HowItWorks />
        <PricingPreview />
        <FinalCTA />
      </main>
      <RodapeLegal />
    </div>
  )
}
