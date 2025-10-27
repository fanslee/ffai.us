import { render, screen } from '@testing-library/react'
import Home from '../pages/home/index'

// Mock useGame to avoid needing the actual provider
vi.mock('../../store/game', () => ({
  useGame: () => ({
    player: { id: 'u1', name: '我', balance: 100, frozen: 0, frozenListed: 0 },
    recharge: vi.fn(),
    stealFromFriend: vi.fn(),
  }),
}))

describe('Home page', () => {
  it('renders title and buttons', () => {
    render(<Home />)
    expect(screen.getByText('大熊猫派对 - 首页')).toBeInTheDocument()
    expect(screen.getByText('我的委托')).toBeInTheDocument()
    expect(screen.getByText('充值 +10')).toBeInTheDocument()
  })
})
