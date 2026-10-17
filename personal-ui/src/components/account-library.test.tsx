// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AccountLibrary, { readAccountPrompts } from './AccountLibrary';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const template={id:'local',title:'Grammar',description:'Private reusable template',body:'Correct this: {{text}}'};
test('saving a private copy sends only the reusable template and requires an explicit click',async()=>{
  const calls:Array<{path:string;body:unknown}>=[];
  vi.stubGlobal('fetch',vi.fn(async(path:string,options:RequestInit)=>{
    calls.push({path,body:options.body?JSON.parse(String(options.body)):undefined});
    return {ok:true,json:async()=>path.includes('get-session')?{user:{email:'test@example.invalid'}}:path==='/api/prompts'&&options.method==='POST'?{id:'saved'}:[]};
  }));
  render(<AccountLibrary explore={false} template={template} onOpen={()=>{}} onSignOut={()=>{}}/>);
  await waitFor(()=>expect(screen.getByText(/Signed in as/)).toBeTruthy());
  expect(calls.filter(c=>c.body)).toHaveLength(0);
  fireEvent.click(screen.getByText('Save private copy'));
  await waitFor(()=>expect(screen.getByText(/Private template copy saved/)).toBeTruthy());
  expect(calls.find(c=>c.body)?.body).toEqual({title:template.title,description:template.description,body:template.body,status:'private'});
});
test('explore opens a plain temporary template copy without writing to the account',async()=>{
  const open=vi.fn();const fetcher=vi.fn(async(path:string)=>({ok:true,json:async()=>path.includes('get-session')?null:[{...template,id:'public'}]}));
  vi.stubGlobal('fetch',fetcher);
  render(<AccountLibrary explore template={template} onOpen={open} onSignOut={()=>{}}/>);
  await waitFor(()=>expect(screen.getByText('Open in workbench')).toBeTruthy());
  fireEvent.click(screen.getByText('Open in workbench'));
  expect(open).toHaveBeenCalledWith({format:'promptroom-share',version:1,template:{title:template.title,description:template.description,body:template.body}});
  expect(fetcher).toHaveBeenCalledTimes(2);
});
test('malformed account results are rejected before display',()=>{
  expect(()=>readAccountPrompts([{id:'bad',title:'Bad'}])).toThrow();
});
