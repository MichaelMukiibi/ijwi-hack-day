import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
let vite, AssistantMessage;
before(async()=>{vite=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});({AssistantMessage}=await vite.ssrLoadModule('/src/components/AssistantMessage.tsx'));});
after(async()=>{await vite?.close();});
const render=content=>renderToStaticMarkup(createElement(AssistantMessage,{content}));
test('existing bold and checklist output renders as readable elements',()=>{
 const html=render('Start with **recorded information**.\n\n1. Approximate age\n2. Screening result');
 assert.match(html,/<strong>recorded information<\/strong>/);assert.match(html,/<ol>/);assert(!html.includes('**'));
});
test('formatting preserves units and values rather than stripping characters',()=>{
 const html=render('Recorded: 6/12 vision; diabetes for 10 years.\nUnknown: screening result.');
 assert(html.includes('6/12'));assert(html.includes('10 years'));assert(html.includes('Unknown: screening result.'));
});
test('model HTML, images, and script links cannot become executable content',()=>{
 const html=render('<script>alert(1)</script>\n\n![tracking](https://example.com/tracker.png)\n\n[unsafe](javascript:alert%281%29)');
 assert(!html.includes('<script'));assert(!html.includes('<img'));assert(!html.includes('javascript:'));assert(!html.includes('tracker.png'));
});
test('safe links open separately and model headings remain compact',()=>{
 const html=render('# Case summary\n\n[Reference](https://example.com/reference)');
 assert(!html.includes('<h1'));assert.match(html,/reply-heading/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/href="https:\/\/example.com\/reference"/);
});
