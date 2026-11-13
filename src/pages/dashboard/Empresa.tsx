import { Page, PageHeader } from '../../components/dashboard/bits'
import { Filamentos } from '../../components/empresa/Filamentos'
import { IdentidadeVisual } from '../../components/empresa/IdentidadeVisual'
import { ImportarPlanilha } from '../../components/empresa/ImportarPlanilha'

export default function Empresa() {
  return (
    <Page>
      <PageHeader title="Empresa" description="Identidade visual, filamentos e importação dos seus dados." />
      <div className="space-y-6">
        <IdentidadeVisual />
        <ImportarPlanilha />
        <Filamentos />
      </div>
    </Page>
  )
}
