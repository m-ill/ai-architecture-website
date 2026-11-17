const input = document.querySelector('#wikiSearch');
const documents = [...document.querySelectorAll('.wiki-document')];
input.addEventListener('input', () => {
  const terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  for (const doc of documents) doc.hidden = !terms.every(term => doc.textContent.toLowerCase().includes(term));
  document.querySelector('#wikiCount').textContent = `${documents.filter(doc=>!doc.hidden).length}개 문서`;
});
document.querySelectorAll('[data-question]').forEach(a => a.href = '/?q=' + encodeURIComponent(a.dataset.question) + '#chat');
const params = new URLSearchParams(location.search);
if (params.get('q')) {input.value=params.get('q');input.dispatchEvent(new Event('input'));}
if (params.get('topic') === 'philosophy') {documents.forEach(doc=>doc.hidden=!doc.id.startsWith('philosophy-'));document.querySelector('#wikiCount').textContent='교육·연구철학';}
