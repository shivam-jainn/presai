import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Landing from './components/Landing'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <Landing />
    </div>
  )
}

export default App
