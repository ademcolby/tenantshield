import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'content/blog')

export type PostMeta = {
  slug: string
  title: string
  description: string
  publishedAt: string
  // U5 (Aug 2026): optional. Set in frontmatter when a post is materially
  // updated; buildArticleSchema emits it as dateModified (falls back to
  // publishedAt when absent).
  updatedAt?: string
}

export type Post = PostMeta & {
  content: string
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return []

  const fileNames = fs.readdirSync(postsDirectory)
  const posts = fileNames
    .filter((f) => f.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)
      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        publishedAt: data.publishedAt as string,
        updatedAt: data.updatedAt as string | undefined,
      }
    })

  return posts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    publishedAt: data.publishedAt as string,
    updatedAt: data.updatedAt as string | undefined,
    content,
  }
}
