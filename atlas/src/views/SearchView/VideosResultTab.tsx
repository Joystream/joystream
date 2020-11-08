import React from 'react'
import { Search_search_item_Video } from '@/api/queries/__generated__/Search'

type VideosResultTabProps = {
  videos: Search_search_item_Video[]
  loading: boolean
}

const VideosResultTab: React.FC<VideosResultTabProps> = () => {
  return <div>VideosResultTab</div>
}

export default VideosResultTab
