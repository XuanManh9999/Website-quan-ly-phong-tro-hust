import { Typography } from 'antd'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type ArticleMarkdownContentProps = {
  body: string
}

function isProbablyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

export function ArticleMarkdownContent({ body }: ArticleMarkdownContentProps) {
  if (!body) {
    return <Typography.Paragraph type="secondary">Bài viết chưa có nội dung.</Typography.Paragraph>
  }

  if (isProbablyHtml(body)) {
    return <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />
  }

  return (
    <div className="article-body markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  )
}
