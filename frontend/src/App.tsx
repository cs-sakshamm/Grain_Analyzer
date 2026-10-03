import { useEffect } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { APP_CONFIG } from '@/config/app'
import { HomePage } from '@/pages/HomePage'

function App() {
  useEffect(() => {
    document.title = APP_CONFIG.name
  }, [])

  return (
    <AppShell>
      <HomePage />
    </AppShell>
  )
}

export default App
