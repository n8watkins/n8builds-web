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
      github: 'https://github.com/n8watkins/appturnity',
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
    des: 'Ranks 1,700+ developer portfolios by what is actually good — head-to-head voting, AI scoring, plus lists, saving, and likes.',
    images: ['/projects/PortfolioRank-1.png'],
    // NOTE: backend stack below is a best-guess (Drizzle/AI) — swap for the real one.
    technologies: {
      Frontend: {
        descriptionParts: [
          {
            text: 'Responsive UI with head-to-head voting and a live leaderboard',
            icons: [{ icon: 're.svg' }, { icon: 'next.svg' }, { icon: 'tail.svg' }],
          },
          {
            text: 'Type-safe throughout',
            icons: [{ icon: 'ts.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'AI scoring ranks portfolios on what actually makes them good',
            icons: [{ icon: 'gpt.png' }],
          },
          {
            text: 'Catalog, votes, lists, saves, and likes stored with a type-safe ORM',
            icons: [{ icon: 'drizzle.png' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Deployed on Vercel with auto-deploy on push',
            icons: [{ icon: 'vercel.png' }, { icon: 'github.png' }],
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
            text: 'Static-exported Next.js; every calculation runs in the browser',
            icons: [{ icon: 'next.svg' }],
          },
        ],
      },
      Backend: {
        descriptionParts: [
          {
            text: 'Live UV from the free Open-Meteo API; Firebase Auth and Firestore sync once you sign in',
            icons: [{ icon: 'firebase.png' }],
          },
        ],
      },
      Cloud: {
        descriptionParts: [
          {
            text: 'Firebase Hosting, deployed by GitHub Actions',
            icons: [{ icon: 'firebase.png' }, { icon: 'github.png' }],
          },
        ],
      },
    },
    github: 'https://github.com/n8watkins/solara',
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
