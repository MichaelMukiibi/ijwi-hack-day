const panels = {
  case: `<p class="workspace-eyebrow">DEMO CASE / 001</p><h3>A case starts with context.</h3><p class="workspace-text">Keep supplied history and screening findings together, with room for what is still unknown.</p><div class="sample-row"><span>Case history</span><strong>Synthetic example</strong></div><div class="sample-row"><span>Fundus photograph</span><strong>Awaiting upload</strong></div><div class="sample-row"><span>Screening result</span><strong>Not run</strong></div><div class="workspace-callout"><span aria-hidden="true">◎</span><p>The image and its screening result stay connected to the conversation.</p></div>`,
  conversation: `<p class="workspace-eyebrow">ILLUSTRATIVE CONVERSATION</p><h3>A question makes room for context.</h3><div class="chat-label">HEALTH WORKER · SAMPLE MESSAGE</div><div class="chat-bubble user">What information is still missing from this case?</div><div class="chat-label">IJWI · SAMPLE RESPONSE</div><div class="chat-bubble">There is no screening result attached yet. Add a fundus photograph and run screening before we discuss its findings.</div><div class="workspace-callout"><span aria-hidden="true">↔</span><p>Planned: Gemma uses available case facts and asks for missing information.</p></div>`,
  summary: `<p class="workspace-eyebrow">ILLUSTRATIVE HANDOFF</p><h3>A clear draft. A human review.</h3><p class="workspace-text">A planned summary brings case facts, actual screening results, and supporting sources together.</p><div class="sample-row"><span>Summary status</span><strong>Example draft</strong></div><div class="sample-row"><span>Supporting evidence</span><strong>Not retrieved</strong></div><div class="sample-row"><span>Specialist review</span><strong>Pending</strong></div><div class="workspace-callout"><span aria-hidden="true">≋</span><p>No clinical findings or source citations are generated in this design preview.</p></div>`
};
const tabs = [...document.querySelectorAll('[data-preview]')];
const panel = document.getElementById('preview-panel');
function selectTab(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', tab.id);
  panel.innerHTML = panels[tab.dataset.preview];
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    }
  });
});
