// Shared presentation timing only. Nothing here initiates API/provider operations.
export const panelSpring={type:'spring',stiffness:240,damping:27,mass:.85};
export const selectionSpring={type:'spring',stiffness:340,damping:28,mass:.7};
export const stageEntrance={hidden:{opacity:0,x:26,y:8},visible:{opacity:1,x:0,y:0},exit:{opacity:0,x:-18,transition:{duration:.16}}};
export const welcomeEntrance={hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:.075,delayChildren:.04}}};
export const welcomeItem={hidden:{opacity:0,y:28},visible:{opacity:1,y:0,transition:{type:'spring',stiffness:170,damping:24}}};
