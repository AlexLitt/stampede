import Script from "next/script";

const STRIP = `(function(){
  function bad(n){
    return n==="bis_skin_checked"||n==="bis_register"||(n&&n.indexOf("bis_")==0);
  }
  function strip(el){
    if(!el||el.nodeType!==1)return;
    var names=el.getAttributeNames?el.getAttributeNames():[];
    for(var i=0;i<names.length;i++) if(bad(names[i])) el.removeAttribute(names[i]);
  }
  function walk(root){
    if(!root||root.nodeType!==1)return;
    strip(root);
    var all=root.querySelectorAll("*");
    for(var i=0;i<all.length;i++) strip(all[i]);
  }
  var proto=Element.prototype;
  var set=proto.setAttribute;
  proto.setAttribute=function(name,value){
    if(bad(String(name))) return;
    return set.call(this,name,value);
  };
  try{
    new MutationObserver(function(ms){
      for(var i=0;i<ms.length;i++){
        var m=ms[i];
        if(m.type==="attributes"&&bad(m.attributeName)) m.target.removeAttribute(m.attributeName);
        var nodes=m.addedNodes||[];
        for(var j=0;j<nodes.length;j++) walk(nodes[j]);
      }
    }).observe(document.documentElement,{subtree:true,childList:true,attributes:true});
  }catch(e){}
  if(document.documentElement) walk(document.documentElement);
})();`;

export function StripExtensionAttrs() {
  return (
    <Script
      id="strip-ext-attrs"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: STRIP }}
    />
  );
}
