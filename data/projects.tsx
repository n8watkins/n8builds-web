export const projects = [
    {
      id: 1,
      title: 'Appturnity',
      subTitle: 'Software Consulting',
      des: 'App consulting service that helps clients validate and scope new software ideas in a clear, modern layout.',
      images: [
        '/projects/Appturnity.webp',
        '/projects/Appturnity1.webp',
        '/projects/Appturnity2.webp',
        '/projects/Appturnity3.webp',

      ],
      technologies: {
        Frontend: {
          descriptionParts: [
            {
              text: 'Simple, clean UI with component-based design',
              icons: [{ icon: 're.svg' }, { icon: 'tail.svg' }],
            },
            {
              text: 'Type-safe architecture for reliable UX',
              icons: [{ icon: 'ts.svg' }],
            },
          ],
        },
        Backend: {
          descriptionParts: [
            {
              text: 'Job matching logic powered by ChatGPT embeddings',
              icons: [{ icon: 'gpt.png' }],
            },

          ],
        },
        Cloud: {
          descriptionParts: [
            {
              text: 'Development IDE and production deployment with Replit',
              icons: [{ icon: 'replit.png' }],
            },
            {
              text: 'Version control via GitHub',
              icons: [{ icon: 'github.png' }],
            },
          ],
        },
      },
      liveSite: 'https://appturnity.com/',
    },
    {
      id: 2,
      title: 'Welcome Page',
      subTitle: 'Property Management',
      des: `A platform designed to streamline board duties with login access, document upload, and email forwarding.`,
      images: [
        '/projects/riverwood.webp',
        '/projects/riverwood1.webp',
        '/projects/riverwood2.webp',
        '/projects/riverwood3.webp',
        '/projects/riverwood4.webp',
        '/projects/riverwood5.webp',
      ],
      technologies: {
        Frontend: {
          descriptionParts: [
            {
              text: 'Responsive design with modern UI',
              icons: [{ icon: 're.svg' }, { icon: 'tail.svg' }],
            },
            {
              text: 'Fast development and hot module replacement with Vite',
              icons: [{ icon: 'vite.svg' }],
            },
            {
              text: 'Type-safe development using TypeScript',
              icons: [{ icon: 'ts.svg' }],
            },
          ],
        },
        Backend: {
          descriptionParts: [
            {
              text: 'RESTful API developed with Express.js',
              icons: [{ icon: 'express.svg' }],
            },
            {
              text: 'Data modeling and validation using Zod',
              icons: [{ icon: 'zod.png' }],
            },
            {
              text: 'Database managed with Drizzle ORM',
              icons: [{ icon: 'drizzle.png' }],
            },
            {
              text: 'Authentication and real-time data',
              icons: [{ icon: 'firebase.png' }],
            },
          ],
        },
        Cloud: {
          descriptionParts: [
            {
              text: 'Deployed on Firebase Hosting',
              icons: [{ icon: 'firebase.png' }],
            },
            {
              text: 'Version control and collaboration via GitHub',
              icons: [{ icon: 'github.svg' }],
            },
          ],
        },
      },
      liveSite: 'https://riverwoodranch.web.app/',
    },
  {
    id: 3,
    title: 'Net-Trailer',
    subTitle: 'Netflix Clone',
    des: 'Find and watch Movie and TV trailers, providing a similar experience to the popular streaming platform',
    images: [
      '/projects/netflix.webp',
      '/projects/netflix1.webp',
      '/projects/netflix2.webp',
      '/projects/netflix3.webp',
    ],
    technologies: {
      Frontend: {
        descriptionParts: [
          {
            text: 'A responsive design with modern UI components',
            icons: [{ icon: 're.svg' }, { icon: 'tail.svg' }],
          },
          {
            text: 'Leveraging Next.js for SSR, SSG, and efficient routing',
            icons: [{ icon: 'next.svg' }],
          },
          {
            text: 'Enhancing reliability with type safety',
            icons: [{ icon: 'ts.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'Integrated payment gateways for secure transactions',
            icons: [{ icon: 'paypal.png' }, { icon: 'stripe.png' }],
          },
          {
            text: 'Implemented secure authentication and authorization',
            icons: [{ icon: 'nextAuth.png' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Deployed with modern hosting and version control',
            icons: [{ icon: 'vercel.png' }, { icon: 'github.png' }],
          },
          {
            text: 'Utilized image hosting for optimized content delivery',
            icons: [{ icon: 'cloud.svg' }],
          },
          {
            text: 'Leveraged Firebase for real-time database and storage',
            icons: [{ icon: 'firebase.png' }],
          },
        ],
      },
    },
    github: 'https://github.com/n8watkins/net_trailer',
    liveSite: 'https://net-trailers.vercel.app/',
  },
  {
    id: 6,
    title: 'Portfolio Rank',
    subTitle: 'Developer Portfolio Ranker',
    des: 'Ranks 1,700+ developer portfolios by what is actually good - head-to-head voting, AI scoring, plus lists, saving, and likes.',
    images: ['/projects/PortfolioRank-1.png'],
    technologies: {
      Frontend: {
        descriptionParts: [
          {
            text: 'Face-off voting, a live leaderboard, and a searchable card grid of every portfolio',
            icons: [{ icon: 're.svg' }, { icon: 'next.svg' }, { icon: 'ts.svg' }, { icon: 'tail.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'GitHub sign-in so each person gets one vote per matchup',
            icons: [{ icon: 'nextAuth.png' }, { icon: 'github.png' }],
          },
          {
            text: 'Gemini judges portfolios head to head and grades each on a 6-axis rubric',
            icons: [{ icon: 'gemini.svg' }],
          },
          {
            text: 'Votes, ELO scores and the catalog in a Turso (libSQL) database',
            icons: [{ icon: 'turso.svg' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Vercel hosting; daily GitHub Actions sync the list, judge, and refresh screenshots',
            icons: [{ icon: 'vercel.png' }, { icon: 'github.png' }],
          },
          {
            text: 'Portfolio screenshots stored in Cloudflare R2',
            icons: [{ icon: 'cloudflare.svg' }],
          },
        ],
      },
    },
    github: 'https://github.com/n8watkins/portfolio-rank',
    liveSite: 'https://portfoliorank.vercel.app/',
  },
  {
    id: 7,
    title: 'Solara',
    subTitle: 'Personal UV & Sun-Exposure Dashboard',
    des: 'Personalized safe sun windows from live UV data, your skin type, and your plans.',
    images: ['/builds/solara/og-image.png'],
    technologies: {
      Frontend: {
        descriptionParts: [
          {
            text: 'Static-exported Next.js app with personalized safe-sun windows, installable as a PWA',
            icons: [{ icon: 're.svg' }, { icon: 'next.svg' }, { icon: 'ts.svg' }, { icon: 'tail.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'Google sign-in, Firestore sync, push notifications and Functions on Firebase',
            icons: [{ icon: 'firebase.png' }],
          },
          {
            text: 'Stripe-backed Pro plan; live UV and weather from Open-Meteo',
            icons: [{ icon: 'stripe.png' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Firebase Hosting, deployed by GitHub Actions after the quality gates pass',
            icons: [{ icon: 'firebase.png' }, { icon: 'github.png' }],
          },
        ],
      },
    },
    liveSite: 'https://uv-activity-planner.web.app',
  },
  {
    id: 8,
    title: 'n8builds.dev',
    subTitle: 'This Site, Tested Like a Product',
    des: 'This site: builds, the N8 Notions blog and the Loadout, with every pull request tested on five browsers.',
    images: ['/builds/n8builds/home-hero.webp'],
    technologies: {
      Frontend: {
        descriptionParts: [
          {
            text: 'App Router in strict TypeScript: static build pages, an hourly-revalidated blog',
            icons: [{ icon: 're.svg' }, { icon: 'next.svg' }, { icon: 'ts.svg' }],
          },
          {
            text: 'Tailwind 4 styling, with reduced motion honored everywhere',
            icons: [{ icon: 'tail.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'Blog posts from Sanity, published without a deploy',
            icons: [{ icon: 'sanity.svg' }],
          },
          {
            text: 'Contact form behind Turnstile and Upstash rate limits, failing closed',
            icons: [{ icon: 'turnstile.svg' }, { icon: 'upstash.svg' }],
          },
          {
            text: 'Errors and CSP violation reports in Sentry',
            icons: [{ icon: 'sentry.svg' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Vercel hosting, deployed from main',
            icons: [{ icon: 'vercel.png' }],
          },
          {
            text: 'Unit, E2E and Lighthouse checks in GitHub Actions on every pull request',
            icons: [{ icon: 'vitest.svg' }, { icon: 'github.png' }],
          },
        ],
      },
    },
    github: 'https://github.com/n8watkins/n8builds-web',
    liveSite: 'https://n8builds.dev',
  },
]

export const techNameMapping = {
  //FRONTEND
  //----->Frameworks
  're.svg': 'React',
  'next.svg': 'Next.js',
  'ts.svg': 'TypeScript',
  //----->Styling & UI Libraries
  'tail.svg': 'Tailwind CSS',
  'shadcn.png': 'ShadCN UI',
  //----->Animation & Interaction
  'three.svg': 'Three.js',
  'gsap.svg': 'GSAP',
  'fm.svg': 'Framer Motion',

  // BACKEND
  //----->Runtime & Logic
  'node.png': 'Node.js',
  'prisma.png': 'Prisma',
  'jest.png': 'Jest',
  //----->API
  'graphql.png': 'GraphQL',
  'apollo.png': 'Apollo',
  'paypal.png': 'Paypal API',
  'stripe.png': 'Stripe API',
  'wha.svg': 'WhatsApp API',
  'insta.svg': 'Instagram API',
  'gpt.png': 'ChatGPT API',
  //----->Auth
  'clerk.svg': 'Clerk',
  'nextAuth.png': 'NextAuth',
  'zod.png': 'Zod',

  // Infrastructure
  //----->Media & Storage
  'cloud.svg': 'Cloudinary',
  //----->databases
  'firebase.png': 'Firebase',
  'aws.png': 'AWS',
  'google.png': 'Google Cloud Platform',
  'mongo.png': 'MongoDB',
  'supabase.png': 'Supabase',
  'PostgreSQL.png': 'PostgreSQL',
  'mysql.png': 'MySQL',
  //----->hosting
  'github.png': 'GitHub',
  'awsAmplify.png': 'Amplify',
  'vercel.png': 'Vercel',
  'netlify.png': 'Netlify',
  'heroku.png': 'Heroku',
  'host.svg': 'Hostinger',
  'digitalocean.png': 'DigitalOcean',
  'replit.png': 'Replit',
  'render.png': 'Render',
  'railway.png': 'Railway',
  'drizzle.png': 'Drizzle ORM',
  'turso.svg': 'Turso',
  'gemini.svg': 'Gemini',
  'cloudflare.svg': 'Cloudflare R2',
  'turnstile.svg': 'Cloudflare Turnstile',
  'sanity.svg': 'Sanity',
  'upstash.svg': 'Upstash Redis',
  'sentry.svg': 'Sentry',
  'vitest.svg': 'Vitest',
  'express.svg': 'Express.js',
  'axios.svg': 'Axios',
  'sentry.png': 'Sentry',
  'eslint.png': 'ESLint',
  'vite.svg': 'Vite',
  'docker.svg': 'Docker',

  //----->Containerization & Orchestration
  'dock.svg': 'Docker',
  'kubernetes.png': 'Kubernetes',
  'github.svg': 'GitHub',
}
