import DOMPurify from 'dompurify';
import type { Transformer } from './types';

export const sanitizerTransformer: Transformer = {
  name: 'sanitizer',

  transform: async (ctx) => {
    const allowScript = ctx.viewSettings.allowScript;
    if (allowScript) return ctx.content;

    let result = ctx.content;

    let sanitized = DOMPurify.sanitize(result, {
      WHOLE_DOCUMENT: true,
      FORBID_TAGS: ['script'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|blob|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_TAGS: ['link', 'meta'],
      ADD_ATTR: (attributeName: string) => {
        return (
          ['xmlns', 'http-equiv', 'content', 'charset', 'link', 'vlink'].includes(attributeName) ||
          attributeName.startsWith('xml:') ||
          attributeName.startsWith('xmlns:') ||
          attributeName.startsWith('epub:')
        );
      },
      RETURN_DOM: true,
    });

    const serializer = new XMLSerializer();
    let serialized = serializer.serializeToString(sanitized);
    serialized = '<?xml version="1.0" encoding="utf-8"?>' + serialized;
    serialized = serialized.replace(/(<head[^>]*>)/i, '\n$1');
    serialized = serialized.replace(/(<\/body>)(<\/html>)/i, '$1\n$2');

    // console.log(`Sanitizer diff:\n${diff(result, serialized)}`);

    return serialized;
  },
};
