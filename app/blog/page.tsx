import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

// NOTE: the root layout applies a `%s | TenantShield` title template. Do NOT
// append "| TenantShield" here — it rendered as "Blog | TenantShield | TenantShield"
// on the live site until July 11, 2026. Same bug previously fixed on all 51 state
// pages; if you add a new page, let the template supply the suffix.
export const metadata = {
  title: 'Blog',
  description:
    'Tenant rights guides, security deposit laws by state, and step-by-step advice for getting your deposit back.',
  alternates: {
    canonical: 'https://gettenantshield.com/blog',
  },
  openGraph: {
    title: 'Blog',
    description:
      'Tenant rights guides, security deposit laws by state, and step-by-step advice for getting your deposit back.',
    url: 'https://gettenantshield.com/blog',
    siteName: 'TenantShield',
    type: 'website',
    images: [
      {
        url: 'https://gettenantshield.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TenantShield — Get your security deposit back',
      },
    ],
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <div style={{ background: '#FAFAF7', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid #E7E5E0',
          padding: '0 24px',
          background: '#FAFAF7',
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

      {/* Hero */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '64px 24px 48px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#B45309',
            marginBottom: '12px',
          }}
        >
          Tenant Resources
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            color: '#0F172A',
            lineHeight: '1.15',
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          Know Your Rights.
          <br />
          Get Your Money Back.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '18px',
            color: '#475569',
            lineHeight: '1.6',
            maxWidth: '560px',
          }}
        >
          Plain-English guides on security deposit law, demand letters, and
          what to do when landlords don&apos;t play by the rules.
        </p>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ borderTop: '1px solid #E7E5E0' }} />
      </div>

      {/* Post List */}
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '0 24px 96px',
        }}
      >
        {posts.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              color: '#94A3B8',
              padding: '48px 0',
            }}
          >
            No posts yet.
          </p>
        ) : (
          posts.map((post, i) => (
            <article
              key={post.slug}
              style={{
                padding: '40px 0',
                borderBottom:
                  i < posts.length - 1 ? '1px solid #E7E5E0' : 'none',
              }}
            >
              <time
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: '#94A3B8',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                {formatDate(post.publishedAt)}
              </time>

              <Link href={`/blog/${post.slug}`} className="blog-post-link">
                <h2 className="blog-post-title">{post.title}</h2>
              </Link>

              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '16px',
                  color: '#475569',
                  lineHeight: '1.65',
                  marginBottom: '20px',
                }}
              >
                {post.description}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#B45309',
                  textDecoration: 'none',
                }}
              >
                Read article →
              </Link>
            </article>
          ))
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #E7E5E0',
          padding: '32px 24px',
          background: '#FAFAF7',
        }}
      >
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: '#94A3B8',
            }}
          >
            © {new Date().getFullYear()} TenantShield LLC. For informational
            purposes only. Not legal advice.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              { label: 'All states', href: '/states' },
              { label: 'About', href: '/about' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Refund Policy', href: '/refund' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: '#94A3B8',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
