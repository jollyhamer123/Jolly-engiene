import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const navigate=html.slice(html.indexOf('function navigate('),html.indexOf('\nfunction go('));
function setup(desktop=false){
  const elements=new Map();
  const $=id=>{if(!elements.has(id))elements.set(id,{style:{}});return elements.get(id)};
  const visits=[];
  const context={URL,document:{baseURI:'https://jollynet.netlify.app/'},window:{jolly:desktop},$,state:{history:[],historyIndex:-1,bookmarks:[]},viewRevision:0,setHoroscopeOpen(){},recordVisit(...args){visits.push(args)},setStatus(){},saveTab(){},renderTabs(){}};
  if(desktop)$('page').loadURL=url=>{$('page').loaded=url;return Promise.resolve()};
  vm.createContext(context);vm.runInContext(navigate,context);
  return {context,$,visits};
}
test('web navigation keeps relative and search result URLs inside the app frame',()=>{
  const {context,$,visits}=setup();
  context.navigate('/about');
  assert.equal($('page').src,'https://jollynet.netlify.app/about');
  context.navigate('https://example.com/article');
  assert.equal($('page').src,'https://example.com/article');
  assert.equal(context.state.view,'page');
  assert.equal($('aiPage').style.display,'none');
  assert.equal(visits.length,2);
  context.navigate('javascript:alert(1)');
  assert.equal(visits.length,2);
});
test('desktop navigation and restored entries use the existing webview',()=>{
  const {context,$,visits}=setup(true);
  context.navigate('https://example.com/',false);
  assert.equal($('page').loaded,'https://example.com/');
  assert.equal(visits.length,0);
});
test('all app links delegate to navigation and never request a new browser tab',()=>{
  assert.doesNotMatch(html,/target\s*=\s*['"]_blank|window\.open\(/);
  assert.match(html,/closest\('a\[href\]'\)/);
  assert.match(html,/e\.preventDefault\(\);navigate\(link\.href\)/);
});
