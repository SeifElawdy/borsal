const fixture=require('./synthetic-fabric.json');
function examples(){
  const piece=(id,x,y)=>({id,polygonCm:[[0,0],[2,0],[0,2]],placement:{translationCm:[x,y],rotationDeg:0},
    outlineBasis:'CUTTING',seamAllowanceStatus:'INCLUDED',grain:{localDirectionDeg:0,toleranceDeg:0}});
  const pass={schemaVersion:'borsal.pattern-layout/0.1',unit:'cm',fabric:{polygonCm:fixture.polygonCm,holes:[],grainDirectionDeg:0},pieces:[piece('triangle-a',22,20),piece('triangle-b',24,25)]};
  const fail=structuredClone(pass);fail.pieces[1].placement.translationCm=[100,100];
  return {provenance:fixture.provenance,assumptions:'Pattern outlines, included-allowance declarations and grain angles are synthetic demonstration inputs, not inferred from the photograph.',layouts:{pass,fail}};
}
module.exports={examples};
