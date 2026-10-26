import { zodResolver } from '@hookform/resolvers/zod'
import { contactFormSchema } from './contact'

// The contact form's validation, loaded on its first use (useContactFormSubmit)
// so zod is not in the JavaScript a page needs before it can render.
export const contactResolver = zodResolver(contactFormSchema)
