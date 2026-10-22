export type CountryBoundary = {code:string;bbox?:number[];polygons:number[][][][]};
function insideRing(lon:number,lat:number,ring:number[][]) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {const [x,y]=ring[i];const [px,py]=ring[j];if((y>lat)!==(py>lat) && lon<(px-x)*(lat-y)/(py-y)+x) inside=!inside;}
  return inside;
}
function boundaryDistance(lon:number,lat:number,ring:number[][]) {
  const scale=Math.max(0.01,Math.cos(lat*Math.PI/180));let minimum=Infinity;
  for(let i=1;i<ring.length;i++) {const a=[(ring[i-1][0]-lon)*111320*scale,(ring[i-1][1]-lat)*111320];const b=[(ring[i][0]-lon)*111320*scale,(ring[i][1]-lat)*111320];const dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/(dx*dx+dy*dy || 1)));minimum=Math.min(minimum,Math.hypot(a[0]+t*dx,a[1]+t*dy));}
  return minimum;
}
export function locateCountry(lat:number,lon:number,accuracy:number,boundaries:CountryBoundary[]) {
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(accuracy)||Math.abs(lat)>90||Math.abs(lon)>180||accuracy<0) return null;
  for(const country of boundaries) {
    if(country.bbox && (lon<country.bbox[0] || lat<country.bbox[1] || lon>country.bbox[2] || lat>country.bbox[3])) continue;
    for(const polygon of country.polygons) {
    if(insideRing(lon,lat,polygon[0]) && !polygon.slice(1).some(r=>insideRing(lon,lat,r))) {
      const distance=Math.min(...polygon.map(r=>boundaryDistance(lon,lat,r)));
      return {countryCode:country.code,accuracy,uncertain:accuracy>10_000 || distance<Math.max(accuracy,5000)};
    }
  }
  }
  return null;
}
