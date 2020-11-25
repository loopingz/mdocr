(window.webpackJsonpeditor=window.webpackJsonpeditor||[]).push([[0],{163:function(e,t,a){e.exports=a(263)},168:function(e,t,a){},191:function(e,t){},193:function(e,t){},194:function(e,t){},195:function(e,t){},196:function(e,t){},228:function(e,t,a){},263:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),l=a(9),c=a.n(l),o=(a(168),a(16)),i=a(11),s=a.n(i),u=a(18),d=a(12),m=a(311),p=a(315),f=a(313),h=a(306),b=a(312),v=a(142),g=a.n(v),E=a(141),y=a.n(E),x=a(140),w=a.n(x),C=a(139),O=a.n(C),j=a(144),k=a.n(j),S=a(145),N=a.n(S),P=a(146),T=a.n(P),I=a(85),D=a.n(I),R=a(88),M=a(143),W=a.n(M),L=a(109),B=a.n(L),V=(a(187),a(68)),A=a(87),z=a(148),F=(a(228),a(314)),U=a(330),_=a(325),G=a(317),H=a(316),J=a(318),q=a(309),Y=a(320),$=a(324),K=a(323),Q=a(319),X=a(321),Z=a(322),ee=a(328),te=a(152),ae=a(137),ne=a.n(ae),re=a(136),le=a.n(re),ce=a(138),oe=a.n(ce),ie=a(110),se=(a(229),a(78));function ue(e){return se.gte(e.current,e.since)?r.a.createElement("div",null,e.children):r.a.createElement("div",null)}var de=Object(h.a)((function(e){return{appBar:{position:"relative"},title:{marginLeft:e.spacing(2)},root:{width:"100%"},container:{}}})),me=Object(h.a)((function(e){return{root:{border:"1px solid #e2e2e1",overflow:"hidden",borderRadius:4,backgroundColor:"#fcfcfb",transition:e.transitions.create(["border-color","box-shadow"]),"&:hover":{backgroundColor:"#fff"},"&$focused":{backgroundColor:"#fff",borderColor:e.palette.primary.main}},focused:{}}})),pe=r.a.forwardRef((function(e,t){return r.a.createElement(q.a,Object.assign({direction:"up",ref:t},e))}));function fe(e){var t=1;return e.indexOf("BREAKING")>=0?t=100:(e.startsWith("feature:")||e.startsWith("feat:")||e.startsWith("feat("))&&(t=10),e.startsWith("release:")&&(t=1),t}function he(e){var t=de(),a=me(),n=r.a.useState(void 0),l=Object(d.a)(n,2),c=l[0],o=l[1],i=r.a.useState(1),h=Object(d.a)(i,2),v=h[0],g=h[1],E=function(e){var t=r.a.useState([]),a=Object(d.a)(t,2),n=a[0],l=a[1],c=r.a.useState(!1),o=Object(d.a)(c,2),i=o[0],m=o[1],p=r.a.useState(!1),f=Object(d.a)(p,2),h=f[0],b=f[1];return r.a.useEffect((function(){(function(){var t=Object(u.a)(s.a.mark((function t(){var a;return s.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return b(!1),m(!0),t.prev=2,t.next=5,fetch(e);case 5:return a=t.sent,t.t0=l,t.t1=ie.b,t.next=10,a.text();case 10:t.t2=t.sent,t.t3=(0,t.t1)(t.t2),(0,t.t0)(t.t3),t.next=18;break;case 15:t.prev=15,t.t4=t.catch(2),b(!0);case 18:m(!1);case 19:case"end":return t.stop()}}),t,null,[[2,15]])})));return function(){return t.apply(this,arguments)}})()()}),[e]),{diffFiles:n,isLoading:i,isError:h}}("".concat(e.url).concat(e.diffUrl,"?incr=").concat(v)),y=E.diffFiles,x=E.isLoading,w=e.label||"Commit changes",C=e.actionLabel||"commit",O=function(){var t=Object(u.a)(s.a.mark((function t(){return s.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(t.t0=e.onAction,!t.t0){t.next=5;break}return t.next=4,e.onAction(c);case 4:t.t0=t.sent;case 5:if(!t.t0){t.next=7;break}e.onClose&&e.onClose();case 7:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}(),j=e.filter||function(){return!0},k=r.a.createElement("div",{style:{flex:1}});return e.commit&&(k=r.a.createElement(ee.a,{InputProps:{classes:a,disableUnderline:!0},label:"Conventional Commit Message",placeholder:"feature: my new awesome feature",style:{flex:1,marginLeft:30,marginRight:30,color:"white"},variant:"filled",value:c,onChange:function(e){var t=e.target.value;v!==fe(t)&&g(fe(t)),o(t)}})),r.a.createElement("div",null,r.a.createElement(m.a,{className:t.dialogAppBar},r.a.createElement(b.a,null,r.a.createElement(f.a,{edge:"start",color:"inherit",onClick:function(){e.onClose&&e.onClose()},"aria-label":"close"},r.a.createElement(le.a,null)),r.a.createElement(te.a,{variant:"h6",className:t.title},w),k,r.a.createElement(F.a,{color:"inherit",onClick:O},C))),x?r.a.createElement(p.a,{className:t.progress}):(y||[]).filter(j).map((function(e){var a=e.oldRevision,n=e.newRevision,l=e.type,c=e.hunks;return[r.a.createElement(te.a,{variant:"h6",className:t.title},e.newPath),r.a.createElement(ie.a,{key:a+"-"+n,viewType:"split",diffType:l,hunks:c})]})))}function be(e){return r.a.createElement(U.a,Object.assign({fullscreen:!0},e,{TransitionComponent:pe}),e.open?r.a.createElement(he,Object.assign({label:"Publish new versions",filter:function(e){return!0},actionLabel:"publish",diffUrl:"/release"},e)):null)}function ve(e){return r.a.createElement(U.a,Object.assign({fullscreen:!0},e,{TransitionComponent:pe}),e.open?r.a.createElement(he,Object.assign({label:"Commit changes",actionLabel:"commit",diffUrl:"/changes",commit:!0},e)):null)}function ge(e,t){return Ee.apply(this,arguments)}function Ee(){return(Ee=Object(u.a)(s.a.mark((function e(t,a){var n;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.prev=0,e.next=3,fetch("".concat(t,"/mdocr"));case 3:return n=e.sent,e.t0=a,e.next=7,n.json();case 7:e.t1=e.sent,(0,e.t0)(e.t1),e.next=14;break;case 11:e.prev=11,e.t2=e.catch(0),setTimeout(ge.bind(this,t,a),1e3);case 14:case"end":return e.stop()}}),e,this,[[0,11]])})))).apply(this,arguments)}function ye(e){return ge(e.url,e.onMdocr),r.a.createElement("div",{"aria-labelledby":"responsive-dialog-title"},r.a.createElement("div",{style:{display:"flex",justifyContent:"center",paddingTop:"30px"}},r.a.createElement("img",{src:"mdocR.svg",alt:"MdocR Logo",style:{width:"200px"}})),r.a.createElement(H.a,{id:"responsive-dialog-title",style:{color:"#3399cc",textAlign:"center"}},"Repository Editor"),r.a.createElement(G.a,null,r.a.createElement("div",{style:{display:"flex",width:"100%",minHeight:"100%"}},r.a.createElement("div",{style:{borderRight:"2px solid #3399cc",padding:"10px",width:"50%",minHeight:"calc(100% - 260px)"}},r.a.createElement("div",{className:"dlgContent"},"MDocr Editor Version:"," ",r.a.createElement("a",{href:"https://github.com/loopingz/mdocr/tree/".concat(e.uiVersion),target:"_blank"},e.uiVersion.substr(0,7))),r.a.createElement("div",{className:"dlgContent"},"You can use MDocr to manage your Markdown documents in a Git repository."),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Install requirements"),r.a.createElement("ul",null,r.a.createElement("li",null,"NodeJS"),r.a.createElement("li",null,"Git client"),r.a.createElement("li",null,"Install MDocR binary",r.a.createElement("pre",null,"npm install -g mdocr"),r.a.createElement("span",{style:{fontSize:"8px"}},"OR"),r.a.createElement("pre",null,"yarn global add mdocr")))),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Initiate a repository"),r.a.createElement("pre",null,"git init")),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Launch in your repository"),r.a.createElement("pre",null,"mdocr edit"))),r.a.createElement("div",{style:{padding:"10px",width:"50%"}},r.a.createElement("div",{className:"dlgContent"},"MDocR use conventional commits to generate the version of the document. It also give you the ability to pull datas from your own systems to automate some contents"),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Conventional commits"),"What is conventional commits?"),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Integrations")),r.a.createElement("div",{className:"dlgContent"},r.a.createElement("h3",null,"Publish"),"Once the documents are ready to publish, you can publish and activate the post publish actions")))))}function xe(e){var t,a=r.a.useState(!1),n=Object(d.a)(a,2),l=n[0],c=n[1],i=r.a.useState(""),s=Object(d.a)(i,2),u=s[0],m=s[1],p=de(),h=[{label:"Document",id:"path",align:"left",minWidth:200},{label:"Version",id:"currentVersion",align:"center"},{label:"Next Version",id:"nextVersion",align:"center"}],b=Object.keys(e.mdocr.files).map((function(t){return Object(o.a)(Object(o.a)({},e.mdocr.files[t]),{},{code:t})}));return se.lt(e.mdocr.version,e.mdocr.latest)&&(t=r.a.createElement("div",{style:{color:"black",backgroundColor:"#ffc107",position:"fixed",left:0,bottom:0,width:"100%",padding:20}},"Your local version (",e.mdocr.version,") of mdocr is not up to date with latest (",e.mdocr.latest,")")),r.a.createElement("div",{"aria-labelledby":"responsive-dialog-title"},r.a.createElement("div",{style:{position:"fixed",width:"100%",backgroundColor:"white",zIndex:3}},r.a.createElement("div",{style:{display:"flex",justifyContent:"center",paddingTop:"30px"}},r.a.createElement("img",{src:"mdocR.svg",alt:"MdocR Logo",style:{width:"200px"}})),r.a.createElement(H.a,{id:"responsive-dialog-title",style:{color:"#3399cc",textAlign:"center"}},"Choose a file to edit"),r.a.createElement(G.a,null,r.a.createElement("div",{style:{display:"flex",flexDirection:"row"}},r.a.createElement("div",{style:{flexGrow:1}},r.a.createElement("div",{className:"dlgContent"},"Current path: ",e.mdocr.path,r.a.createElement("br",null),"Current repository: ",e.mdocr.repository,r.a.createElement("br",null),t,r.a.createElement("br",null),"Please select a file")),r.a.createElement("div",{style:{display:"flex",flexDirection:"column"}},r.a.createElement(ue,{current:e.mdocr.version,since:"2.0.0"},r.a.createElement(F.a,{color:"primary",startIcon:r.a.createElement(ne.a,null),onClick:function(){c(!0)}},"New Document")),r.a.createElement(ee.a,{InputProps:{endAdornment:r.a.createElement(J.a,{position:"end"},r.a.createElement(D.a,null))},label:"Filter",value:u,onChange:function(e){return m(e.target.value)}}))))),r.a.createElement(G.a,{style:{paddingTop:"350px"}},r.a.createElement(Q.a,{className:p.container},r.a.createElement(Y.a,{stickyHeader:!0,"aria-label":"sticky table",size:"small"},r.a.createElement(X.a,null,r.a.createElement(Z.a,null,h.map((function(e){return r.a.createElement(K.a,{key:e.id,align:e.align,style:{minWidth:e.minWidth}},e.label)})),r.a.createElement(K.a,null))),r.a.createElement($.a,null,b.filter((function(e){return e.path.indexOf(u)>=0})).map((function(t){return r.a.createElement(Z.a,{hover:!0,role:"checkbox",tabIndex:-1,key:t.code,onDoubleClick:function(){e.onChange(Object(o.a)(Object(o.a)({},t),{},{value:t.path,label:t.path}))}},h.map((function(e){var a=t[e.id];return r.a.createElement(K.a,{key:e.id,align:e.align},e.format&&"number"===typeof a?e.format(a):a)})),r.a.createElement(K.a,{key:"action"},r.a.createElement(f.a,{"aria-label":"edit",size:"small",onClick:function(){e.onChange(Object(o.a)(Object(o.a)({},t),{},{value:t.path,label:t.path}))},className:p.margin},r.a.createElement(oe.a,null))))})))))),r.a.createElement(we,{handleClose:e.onAdd,open:l}))}function we(e){var t=r.a.useState(""),a=Object(d.a)(t,2),n=a[0],l=a[1],c=r.a.useState(""),o=Object(d.a)(c,2),i=o[0],s=o[1];return r.a.createElement(U.a,{onClose:e.handleClose,"aria-labelledby":"simple-dialog-title",open:e.open},r.a.createElement(H.a,{id:"simple-dialog-title",style:{color:"#3399cc"}},"Add a new document"),r.a.createElement(G.a,null,r.a.createElement("div",{className:"dlgContent"},"The document will be added to your repository, filename should include the path."),r.a.createElement("div",null,r.a.createElement(ee.a,{required:!0,value:n,onChange:function(e){l(e.target.value)},id:"filename",label:"Filename (with .md)",defaultValue:"",variant:"filled",fullWidth:!0})),r.a.createElement("div",null,r.a.createElement(ee.a,{required:!0,value:i,onChange:function(e){s(e.target.value)},id:"title",label:"Title",defaultValue:"",variant:"filled",fullWidth:!0}))),r.a.createElement(_.a,null,r.a.createElement(F.a,{onClick:e.handleClose},"Cancel"),r.a.createElement(F.a,{disabled:!(n&&n.endsWith(".md")&&i),onClick:function(){return e.handleClose(n,i)},color:"primary"},"Create")))}function Ce(e){return r.a.createElement(U.a,{open:e.open,onClose:e.handleClose,"aria-labelledby":"alert-dialog-slide-title","aria-describedby":"alert-dialog-slide-description"},r.a.createElement(H.a,{id:"alert-dialog-slide-title"},"Delete confirmation?"),r.a.createElement(G.a,null,r.a.createElement("div",{className:"dlgContent",id:"alert-dialog-slide-description"},"Are you sure you want to delete this document, its built and published versions?",r.a.createElement("br",null),r.a.createElement("br",null),e.file)),r.a.createElement(_.a,null,r.a.createElement(F.a,{onClick:function(){return e.handleClose(!1)}},"Cancel"),r.a.createElement(F.a,{onClick:function(){return e.handleClose(!0)},style:{color:"red"}},"Confirm")))}var Oe=a(149),je=a(331),ke=a(326),Se=a(264),Ne=a(14),Pe=Object(h.a)((function(e){return{root:{flexGrow:1,minWidth:"50%"},input:{display:"flex",padding:0,height:"auto",color:"white"},valueContainer:{display:"flex",flexWrap:"wrap",flex:1,alignItems:"center",overflow:"hidden",color:"white"},chip:{margin:e.spacing(.5,.25)},chipFocused:{backgroundColor:Object(Ne.b)("light"===e.palette.type?e.palette.grey[300]:e.palette.grey[700],.08)},noOptionsMessage:{padding:e.spacing(1,2)},singleValue:{fontSize:16},placeholder:{position:"absolute",left:2,bottom:6,fontSize:16,color:"white"},paper:{position:"absolute",zIndex:1,marginTop:e.spacing(1),left:0,right:0,bottom:0},divider:{height:e.spacing(2)}}}));function Te(e){var t=e.inputRef,a=Object(Oe.a)(e,["inputRef"]);return r.a.createElement("div",Object.assign({ref:t},a))}var Ie={Control:function(e){var t=e.children,a=e.innerProps,n=e.innerRef,l=e.selectProps,c=l.classes,i=l.TextFieldProps;return r.a.createElement(ee.a,Object.assign({fullWidth:!0,InputProps:{classes:{input:c.input},inputComponent:Te,inputProps:Object(o.a)({className:c.input,ref:n,children:t},a)}},i))},Menu:function(e){return r.a.createElement(Se.a,Object.assign({square:!0,className:e.selectProps.classes.paper},e.innerProps),e.children)},NoOptionsMessage:function(e){return r.a.createElement(te.a,Object.assign({color:"textSecondary",className:e.selectProps.classes.noOptionsMessage},e.innerProps),e.children)},Option:function(e){return r.a.createElement(je.a,Object.assign({ref:e.innerRef,selected:e.isFocused,component:"div",style:{fontWeight:e.isSelected?500:400}},e.innerProps),e.children)},Placeholder:function(e){var t=e.selectProps,a=e.innerProps,n=void 0===a?{}:a,l=e.children;return r.a.createElement(te.a,Object.assign({color:"textSecondary",className:t.classes.placeholder},n),l)},SingleValue:function(e){return r.a.createElement(te.a,Object.assign({className:e.selectProps.classes.singleValue},e.innerProps),e.children)},ValueContainer:function(e){return r.a.createElement("div",{className:e.selectProps.classes.valueContainer},e.children)}};function De(e){var t=Pe(),a={input:function(e){return Object(o.a)(Object(o.a)({},e),{},{color:"white","& input":{font:"inherit",color:"white"}})}};return r.a.createElement("div",{className:t.root},r.a.createElement(ke.a,null,r.a.createElement(A.a,{classes:t,styles:a,inputId:"react-select-single",TextFieldProps:{label:"File",InputLabelProps:{htmlFor:"react-select-single",shrink:!0,style:{color:"white"}}},menuPlacement:"top",menuPosition:"fixed",components:Ie,placeholder:"Search for a file to edit",options:e.drafts.map((function(e){return Object(o.a)({label:e.path,value:e.path},e)})),value:e.value,onChange:function(t,a){e.onChange&&e.onChange(t)}})))}V.pdfjs.GlobalWorkerOptions.workerSrc="//cdnjs.cloudflare.com/ajax/libs/pdf.js/".concat(V.pdfjs.version,"/pdf.worker.js");var Re,Me,We="ac993b378febbdc16bf313110db9e4aa47b1ffe2",Le=Object(h.a)((function(e){return{progress:{margin:e.spacing(2)},text:{padding:e.spacing(2,2,0)},paper:{paddingBottom:50},list:{marginBottom:e.spacing(2)},subheader:{backgroundColor:e.palette.background.paper},dialogAppBar:{position:"relative"},title:{marginLeft:e.spacing(2),flex:1},appBar:{top:"auto",bottom:0},grow:{flexGrow:1},fabButtons:{position:"absolute",zIndex:1,top:-30,left:0,right:0,margin:"0 auto"}}}));function Be(){var e=parseInt(localStorage.getItem("splitPos")||window.innerWidth/2,10),t=r.a.useState(),a=Object(d.a)(t,2),l=a[0],c=a[1],i="http://localhost:18181",h=r.a.useState(""),v=Object(d.a)(h,2),E=v[0],x=v[1],C=r.a.useState(""),j=Object(d.a)(C,2),S=j[0],P=j[1],I=r.a.useState(!1),M=Object(d.a)(I,2),F=M[0],U=M[1],_=r.a.useState(null),G=Object(d.a)(_,2),H=G[0],J=G[1],q=r.a.useState(null),Y=Object(d.a)(q,2),$=Y[0],K=Y[1],Q=r.a.useState(0),X=Object(d.a)(Q,2),Z=X[0],ee=X[1],te=r.a.useState(!0),ae=Object(d.a)(te,2),ne=ae[0],re=ae[1],le=r.a.useState(null),ce=Object(d.a)(le,2),oe=ce[0],ie=ce[1],se=r.a.useState(!1),de=Object(d.a)(se,2),me=de[0],pe=de[1],fe=r.a.useState(!1),he=Object(d.a)(fe,2),ge=he[0],Ee=he[1],Oe=r.a.useState(!1),je=Object(d.a)(Oe,2),ke=je[0],Se=je[1],Ne=r.a.useState(!1),Pe=Object(d.a)(Ne,2),Te=Pe[0],Ie=Pe[1],Be=r.a.useState(!1),Ve=Object(d.a)(Be,2),Ae=Ve[0],ze=Ve[1],Fe=r.a.useState(0),Ue=Object(d.a)(Fe,2),_e=Ue[0],Ge=Ue[1],He=r.a.useState(0),Je=Object(d.a)(He,2),qe=Je[0],Ye=Je[1],$e=r.a.useState(e),Ke=Object(d.a)($e,2),Qe=Ke[0],Xe=Ke[1],Ze=Le(),et=Object(n.useRef)(null),tt=Object(n.useCallback)((function(e){window.document.getElementById("preview")?window.document.getElementById("preview").scrollTop=_e:et.current&&(et.current.scrollTop=_e),et.current=e}),[_e]);if(!l)return r.a.createElement(ye,{uiVersion:We,onMdocr:c,url:i});var at=function(){var e=Object(u.a)(s.a.mark((function e(t){var a,n,r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if("none"!==t.value){e.next=2;break}return e.abrupt("return");case 2:return"pdf"===t.value?(a=document.getElementsByClassName("react-pdf__Document")).length?Ge(a[0].scrollTop):Ge(0):(n=document.getElementById("preview"),Ge(n?n.scrollTop:0)),Ye(qe+1),pe(!0),e.next=7,fetch("".concat(i,"/").concat(t.value,"/").concat(H.path));case 7:if(r=e.sent,"pdf"!==t.value){e.next=16;break}return e.t0=ie,e.next=12,r.arrayBuffer();case 12:e.t1=e.sent,(0,e.t0)(e.t1),e.next=21;break;case 16:return e.t2=ie,e.next=19,r.text();case 19:e.t3=e.sent,(0,e.t2)(e.t3);case 21:pe(!1);case 22:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),nt=r.a.createElement(D.a,{style:{width:"128px",height:"128px",color:"#999"}}),rt=!1,lt=function(){var e=Object(u.a)(s.a.mark((function e(t,a){var n,r,l;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(Ie(!1),!t||!a){e.next=10;break}return e.next=4,fetch("".concat(i,"/drafts/").concat(t),{method:"POST",body:JSON.stringify({title:a})});case 4:return n=e.sent,e.next=7,n.json();case 7:for(l in r=e.sent,c(r),r.files)r.files[l].path===t&&J(r.files[l]);case 10:case"end":return e.stop()}}),e)})));return function(t,a){return e.apply(this,arguments)}}();me?(rt=!0,nt=r.a.createElement(p.a,{className:Ze.progress})):$&&"none"!==$.value?"build"===$.value?nt=r.a.createElement("pre",{id:"preview",className:"buildContent",ref:tt},oe):"html"===$.value?nt=r.a.createElement("div",{id:"preview",className:"previewContent",ref:tt,style:{padding:10},dangerouslySetInnerHTML:{__html:oe.replace(/<style>[\w\W]*<\/style>/gm,"")}}):"pdf"===$.value&&function(){for(var e=[],t=0,a=1;a<=Z;a++)e.push(r.a.createElement(V.Page,{id:a,pageNumber:a,onLoadSuccess:function(){if(++t===Z){var e=document.getElementsByClassName("react-pdf__Document");e.length&&(e[0].scrollTop=_e)}}}));nt=r.a.createElement(V.Document,{file:oe,onLoadSuccess:function(e){var t=e.numPages;ee(t)}},e)}():rt=!0,rt&&(nt=r.a.createElement("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",position:"absolute",width:"100%",bottom:"60px",top:"48px"}},nt));var ct=function(){var e=Object(u.a)(s.a.mark((function e(){var t,a,n,r,l=arguments;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(t=l.length>0&&void 0!==l[0]?l[0]:H){e.next=3;break}return e.abrupt("return");case 3:return e.next=5,fetch("".concat(i,"/drafts/").concat(t.path));case 5:return a=e.sent,e.next=8,a.text();case 8:(n=e.sent).startsWith("---")&&(r=n.substr(0,n.substr(3).indexOf("---")+7),P(r),n=n.substr(r.length)),x(n),$&&at($);case 12:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();if(!H&&l)return r.a.createElement(xe,{uiVersion:We,mdocr:l,onAdd:lt,onChange:function(){var e=Object(u.a)(s.a.mark((function e(t){return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:J(t),ct(t);case 2:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}()});var ot=L.commands.getDefaultCommands();ot.push({commands:[{name:"metadata",buttonProps:{"aria-label":"Display Metadata",color:"#000",title:F?"Hide Meta":"Display Meta"},icon:function(){return r.a.createElement("div",null,"Display Meta")},execute:function(e,t){U(!F)},keyCommand:"meta"}]});var it=E;F&&(it=S+E);var st=ne?Qe:window.innerWidth,ut=ne?r.a.createElement(O.a,null):r.a.createElement(w.a,null);return r.a.createElement("div",null,r.a.createElement(f.a,{onClick:function(){return re(!ne)},style:{zIndex:2,position:"fixed",left:st-40}},ut),r.a.createElement(z.a,{split:"vertical",defaultSize:e,size:ne?Qe:window.innerWidth,onChange:function(e){localStorage.setItem("splitPos",e),Xe(e)}},r.a.createElement("div",null,r.a.createElement(B.a,{value:it,onChange:function(e){x(e),Re&&clearTimeout(Re),Re=setTimeout(Object(u.a)(s.a.mark((function t(){var a,n;return s.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return a=F?e:S+e,t.next=3,fetch("".concat(i,"/drafts/").concat(H.path),{method:"PUT",body:a});case 3:c(Object(o.a)(Object(o.a)({},l),{},{isDirty:!0})),$&&(Me&&clearTimeout(Me),n=5e3,"build"===$.value&&(n=100),Me=setTimeout((function(){$&&at($)}),n));case 5:case"end":return t.stop()}}),t)}))),1e3)},minEditorHeight:"inherit",commands:ot,generateMarkdownPreview:function(){var e=Object(u.a)(s.a.mark((function e(t){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(H){e.next=2;break}return e.abrupt("return","");case 2:return e.next=4,fetch("".concat(i,"/build/").concat(H.gitPath));case 4:return a=e.sent,e.t0="<pre>",e.next=8,a.text();case 8:return e.t1=e.sent,e.abrupt("return",e.t0.concat.call(e.t0,e.t1,"</pre>"));case 10:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}()}),r.a.createElement(m.a,{position:"fixed",color:"primary",className:Ze.appBar},r.a.createElement(b.a,null,r.a.createElement("div",{title:"Welcome Panel",onClick:function(){J(void 0)},style:{cursor:"pointer",position:"fixed",bottom:"60px",left:st-(ne?32:80)}},r.a.createElement("img",{src:"mdocR.svg",alt:"MdocR Logo",style:{width:"64px"}})),r.a.createElement(ue,{current:l.version,since:"2.0.0"},r.a.createElement(f.a,{color:"inherit",onClick:function(){return ze(!0)},style:{marginLeft:"-24px"}},r.a.createElement(y.a,null))),r.a.createElement(De,{drafts:Object.values(l.files),onChange:function(){var e=Object(u.a)(s.a.mark((function e(t){return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:J(t),ct(t);case 2:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),value:H}),r.a.createElement(ue,{current:l.version,since:"2.0.0"},r.a.createElement(f.a,{color:"inherit",onClick:function(){return Ie(!0)}},r.a.createElement(g.a,null))),r.a.createElement("div",{className:Ze.grow},"Repository: ",l.path),r.a.createElement(f.a,{disabled:!l.isDirty,color:"inherit",onClick:function(){return Ee(!0)}},r.a.createElement(W.a,null)),r.a.createElement(f.a,{edge:"end",color:"inherit",disabled:l.isDirty,onClick:function(){return Se(!0)}},r.a.createElement(k.a,null))))),r.a.createElement("div",null,r.a.createElement("div",{style:{backgroundColor:"#f9f9f9",display:"flex",height:"44px",borderBottom:"1px solid #c8ccd0",borderRadius:"2px 2px 0 0"}},r.a.createElement("div",{style:{padding:10}},"Preview"),r.a.createElement("div",{style:{paddingRight:10,paddingTop:3,flexGrow:1}},r.a.createElement(A.a,{value:$,onChange:function(e){Me&&clearTimeout(Me),Ge(0),K(e),at(e)},placeholder:"Select a type of preview",options:[{label:"PDF",value:"pdf"},{label:"HTML",value:"html"},{label:"Markdown",value:"build"},{label:"-",value:"none"}]})),r.a.createElement("div",null,r.a.createElement(f.a,{color:"inherit",onClick:function(){at($)},disabled:!$||"none"===$.value},r.a.createElement(N.a,null)),r.a.createElement(f.a,{color:"inherit",onClick:Object(u.a)(s.a.mark((function e(){var t,a,n,r;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=$.value,e.next=3,fetch("".concat(i,"/").concat(t,"/").concat(H.path));case 3:return a=e.sent,e.next=6,a.blob();case 6:n=e.sent,r=H.path.split("/").pop(),"pdf"===t?R(n,"".concat(r,".pdf"),"application/octect-stream"):"html"===t?R(n,"".concat(r,".html"),"text/html"):"build"===t&&R(n,"".concat(r,".md"),"text/plain");case 9:case"end":return e.stop()}}),e)}))),disabled:!$||"none"===$.value},r.a.createElement(T.a,null)))),nt)),r.a.createElement(be,{open:ke,onClose:function(){return Se(!1)},url:i,onAction:Object(u.a)(s.a.mark((function e(){return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("".concat(i,"/release"),{method:"PUT"});case 2:return e.next=4,ct();case 4:return e.abrupt("return",!0);case 5:case"end":return e.stop()}}),e)})))}),r.a.createElement(ve,{open:ge,onClose:function(){return Ee(!1)},url:i,onAction:function(){var e=Object(u.a)(s.a.mark((function e(t){return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,fetch("".concat(i,"/commit"),{method:"PUT",body:JSON.stringify({message:t})});case 2:return c(Object(o.a)(Object(o.a)({},l),{},{isDirty:!1})),e.abrupt("return",!0);case 4:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}()}),r.a.createElement(we,{mdocr:l,handleClose:lt,open:Te}),r.a.createElement(Ce,{handleClose:function(){var e=Object(u.a)(s.a.mark((function e(t){var a;return s.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(ze(!1),!t){e.next=14;break}return e.next=4,fetch("".concat(i,"/drafts/").concat(H.path),{method:"DELETE"});case 4:return a=e.sent,e.t0=c,e.t1=o.a,e.t2={},e.next=10,a.json();case 10:e.t3=e.sent,e.t4=(0,e.t1)(e.t2,e.t3),(0,e.t0)(e.t4),J(void 0);case 14:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),file:H.path,open:Ae}))}Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));var Ve=a(147),Ae=a(327),ze=Object(Ve.a)({palette:{primary:{main:"#3399cc"}}});c.a.render(r.a.createElement(Ae.a,{theme:ze},r.a.createElement(Be,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()}))},70:function(e,t){function a(e){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}a.keys=function(){return[]},a.resolve=a,e.exports=a,a.id=70}},[[163,1,2]]]);
//# sourceMappingURL=main.b1b2e647.chunk.js.map