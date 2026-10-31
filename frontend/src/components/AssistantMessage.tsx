import Markdown from 'react-markdown';

/** Render model formatting as elements, never as executable HTML. User messages stay plain text. */
export function AssistantMessage({content}: {content: string}) {
  return <div className="assistant-response"><Markdown
    skipHtml
    allowedElements={['p','br','strong','em','ul','ol','li','blockquote','code','pre','a','hr','h1','h2','h3','h4','h5','h6']}
    urlTransform={url => /^https?:\/\//i.test(url) ? url : ''}
    components={{
      a: ({href,children}) => href ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>,
      h1: ({children}) => <p className="reply-heading">{children}</p>,
      h2: ({children}) => <p className="reply-heading">{children}</p>,
      h3: ({children}) => <p className="reply-heading">{children}</p>,
      h4: ({children}) => <p className="reply-heading">{children}</p>,
      h5: ({children}) => <p className="reply-heading">{children}</p>,
      h6: ({children}) => <p className="reply-heading">{children}</p>,
    }}
  >{content}</Markdown></div>;
}
