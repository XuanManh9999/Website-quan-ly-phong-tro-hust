import { Space } from 'antd'
import { HomeFeatures } from '../components/home/HomeFeatures'
import { HomeHero } from '../components/home/HomeHero'
import { HomeStats } from '../components/home/HomeStats'

export function HomePage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <HomeHero />
      <HomeFeatures />
      <HomeStats />
    </Space>
  )
}
