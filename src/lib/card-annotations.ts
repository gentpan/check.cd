import { createServerFn } from '@tanstack/react-start';
import { validateCardAnnotationInput, type CardAnnotation } from './card-annotations-validation';
export type CardAnnotations = {source:'ai'|'unavailable'; notes:Record<string,CardAnnotation>};
export const fetchCardAnnotations = createServerFn({method:'POST'})
  .validator(validateCardAnnotationInput)
  .handler(async ({data}):Promise<CardAnnotations> => {
    const {generateCardAnnotations} = await import('@/server/card-annotations');
    return generateCardAnnotations(data);
  });
