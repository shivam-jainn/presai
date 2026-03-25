import Landing from './components/pages/Landing'
import Slides from './components/pages/Slides'

function App() {
  const isSignedIn = true

  return (
    <div>
      {
        isSignedIn ? <Slides /> : <Landing />
      }
    </div>
  )
}

export default App
