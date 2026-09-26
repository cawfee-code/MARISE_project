export const stagesData = [
 {number:'01',label:'Detection',title:'Find the signal.',subtitle:'SAR Image Analysis & Spill Detection',description:'Isolate potential oil signatures from the surrounding sea.',labels:['Original SAR','Model overlay','Segmentation']},
 {number:'02',label:'Characterization',title:'Read the signature.',subtitle:'Spill Characterization',description:'Measure the geometry and geographic footprint of the detected region.',labels:['Geometry','Position','Confidence']},
 {number:'03',label:'Backtracking',title:'Trace it upstream.',subtitle:'Drift Backtracking',description:'Reconstruct a possible source corridor using the backend drift model.',labels:['−12 h','−6 h','Observation']},
 {number:'04',label:'AIS correlation',title:'Connect the trajectories.',subtitle:'AIS Vessel Correlation',description:'Compare simulated vessel positions with the inferred source region.',labels:['Routes','Source region','AIS gaps']},
 {number:'05',label:'Attribution',title:'Weigh the evidence.',subtitle:'Source Attribution & Confidence Analysis',description:'Assess competing hypotheses without turning correlation into certainty.',labels:['Evidence','Candidates','Limitations']},
 {number:'06',label:'Forecast',title:'Look beyond the horizon.',subtitle:'Spill Forecasting',description:'Explore potential transport and the uncertainty that grows with time.',labels:['+6 h','+12 h','+24 h','+48 h']}
];

