import { useAuth } from './contexts/AuthContext'
import Landing from './components/pages/Landing'
import Slides from './components/pages/Slides'

function App() {
  const { isSignedIn } = useAuth()

  return (
    <div>
      {
        isSignedIn ? <Slides /> : <Landing />
      }
    </div>
  )
}

export default App
