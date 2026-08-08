import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { getPostBySlug, getAllPosts } from '@/lib/posts'
import SiteFooter from '@/app/components/SiteFooter'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      url: `https://gettenantshield.com/blog/${post.slug}`,
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function buildArticleSchema(post: {
  title: string
  description: string
  slug: string
  publishedAt: string
  // U5 (Aug 2026): optional frontmatter field. When a post is materially
  // updated (e.g. the Jan annual refresh), add `updatedAt: "YYYY-MM-DD"` to
  // its frontmatter and dateModified diverges from datePublished; absent, it
  // falls back to publishedAt — identical output to the pre-U5 behavior.
  // NOTE: requires lib/posts.ts to pass `updatedAt` through from frontmatter.
  updatedAt?: string
}) {
  // Convert YYYY-MM-DD to full ISO 8601 with timezone
  const dateISO = `${post.publishedAt}T00:00:00-05:00`
  const modifiedISO = post.updatedAt
    ? `${post.updatedAt}T00:00:00-05:00`
    : dateISO

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: dateISO,
    dateModified: modifiedISO,
    url: `https://gettenantshield.com/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name: 'TenantShield',
      url: 'https://gettenantshield.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TenantShield',
      url: 'https://gettenantshield.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gettenantshield.com/icon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://gettenantshield.com/blog/${post.slug}`,
    },
  }
}

function buildDatasetSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Security Deposit Return Deadlines — All 50 US States + DC',
    description:
      'Complete table of security deposit return deadlines, penalty provisions, and statute citations for all 50 US states plus the District of Columbia. Updated 2026.',
    url: 'https://gettenantshield.com/blog/security-deposit-return-deadlines-all-50-states',
    license: 'https://gettenantshield.com/terms',
    creator: {
      '@type': 'Organization',
      name: 'TenantShield',
      url: 'https://gettenantshield.com',
    },
    temporalCoverage: '2026',
    spatialCoverage: 'United States',
    keywords:
      'security deposit, return deadline, tenant rights, landlord law, state law, demand letter',
  }
}

/*
 * Letter-document card ("blueprint" format, July 2026).
 * Blog sample letters are wrapped in <div class="letter-doc"> inside the
 * markdown (rendered via rehype-raw). The card visually echoes the generated
 * PDF: white paper, Helvetica, non-italic, true paragraph + address-block
 * spacing. Styles are scoped under .letter-doc with higher specificity than
 * .prose-tenantshield descendants so nothing leaks into (or in from) the
 * shared prose styles. Do NOT move these into globals.css.
 */
const letterDocStyles = `
  .prose-tenantshield .letter-doc {
    background: #FFFFFF;
    border: 1px solid #E2E0DA;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.08);
    padding: clamp(28px, 6vw, 56px);
    margin: 40px 0 16px;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 15px;
    line-height: 1.7;
    color: #111827;
    font-style: normal;
    overflow-wrap: break-word;
  }
  .prose-tenantshield .letter-doc p {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
    font-style: normal;
    margin: 0 0 1.35em;
    padding: 0;
    border: none;
  }
  .prose-tenantshield .letter-doc p:last-child {
    margin-bottom: 0;
  }
  .prose-tenantshield .letter-doc strong {
    font-weight: 700;
    color: inherit;
  }
  .prose-tenantshield .letter-doc em {
    font-style: normal;
  }
  .prose-tenantshield .letter-doc a {
    color: inherit;
    text-decoration: none;
    pointer-events: none;
  }
`

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const is50StatesPost =
    slug === 'security-deposit-return-deadlines-all-50-states'

  return (
    <div style={{ background: '#FAFAF7', minHeight: '100vh' }}>
      {/* JSON-LD — Article schema on all posts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArticleSchema(post)),
        }}
      />
      {/* JSON-LD — Dataset schema only on 50-states post */}
      {is50StatesPost && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildDatasetSchema()),
          }}
        />
      )}

      {/* Letter-document card styles (scoped; see comment above) */}
      <style dangerouslySetInnerHTML={{ __html: letterDocStyles }} />

      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #E7E5E0',
          padding: '0 24px',
          background: '#FAFAF7',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2L4 8v10c0 7 5.4 12.4 12 14 6.6-1.6 12-7 12-14V8L16 2z"
                fill="#B45309"
              />
              <text
                x="16"
                y="21"
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="700"
                fontFamily="serif"
              >
                TS
              </text>
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '18px',
                color: '#0F172A',
                letterSpacing: '-0.02em',
              }}
            >
              TenantShield
            </span>
          </Link>
          <Link
            href="/generate"
            style={{
              background: '#B45309',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Get Your Letter
          </Link>
        </div>
      </header>

      {/* Article */}
      <article
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '56px 24px 96px',
        }}
      >
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '32px' }}>
          <Link
            href="/blog"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: '#94A3B8',
              textDecoration: 'none',
            }}
          >
            ← All articles
          </Link>
        </nav>

        {/* Meta */}
        <time
          dateTime={post.publishedAt}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: '#94A3B8',
            display: 'block',
            marginBottom: '16px',
          }}
        >
          {formatDate(post.publishedAt)}
        </time>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: '700',
            color: '#0F172A',
            lineHeight: '1.15',
            letterSpacing: '-0.03em',
            marginBottom: '24px',
          }}
        >
          {post.title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '19px',
            color: '#475569',
            lineHeight: '1.65',
            borderLeft: '3px solid #B45309',
            paddingLeft: '20px',
            marginBottom: '48px',
          }}
        >
          {post.description}
        </p>

        {/* Divider */}
        <div
          style={{ borderTop: '1px solid #E7E5E0', marginBottom: '48px' }}
        />

        {/* Markdown Body */}
        <div className="prose-tenantshield">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            marginTop: '64px',
            padding: '40px',
            background: '#FEF3C7',
            borderRadius: '12px',
            border: '1px solid #FCD34D',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: '700',
              color: '#0F172A',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}
          >
            Ready to send your demand letter?
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              color: '#78350F',
              marginBottom: '24px',
              lineHeight: '1.6',
            }}
          >
            TenantShield generates a state-specific, statute-cited demand
            letter in minutes. One flat fee. No subscription.
          </p>
          <Link
            href="/generate"
            style={{
              display: 'inline-block',
              background: '#B45309',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '8px',
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              fontWeight: '700',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Generate Your Letter — $39
          </Link>
        </div>

        {/* Back to blog */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <Link
            href="/blog"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: '#94A3B8',
              textDecoration: 'none',
            }}
          >
            ← Back to all articles
          </Link>
        </div>
      </article>



      <SiteFooter />
    </div>
  )
}
