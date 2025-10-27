import { PropsWithChildren, createElement } from 'react'
import { useLaunch } from '@tarojs/taro'
import { GameProvider } from './store/game'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // Avoid JSX in .ts entry; use createElement instead
  return createElement(GameProvider, null, children)
}

export default App
