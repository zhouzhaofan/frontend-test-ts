import React from 'react';
import {init as initEChart, EChartOption, EChartsResponsiveOption, ECharts } from 'echarts';

const echartGl=require('echarts-gl');

export interface EChartProps {
    theme?:String|Object;
    opts?:object;
    options:EChartOption|EChartsResponsiveOption;
    children?:React.ReactNode;
}

export default class EChart extends React.PureComponent{
    private echartRef:React.RefObject<HTMLDivElement>;
    private echartInstance?:ECharts;
    
    constructor(props:EChartProps){
        super(props);
        this.echartRef=React.createRef();
    }

    render(){
       return <div className="echart" style={{width:'100%',height:'100%'}} ref={this.echartRef}/>
    }

    componentDidMount(){
        this.repaint();
    }


    componentDidUpdate(){
        this.repaint();
    }


    repaint(){
        console.log(echartGl);
        const {options,theme,opts}=this.props as EChartProps;
        console.log(options);

        if(this.echartInstance&&!this.echartInstance.isDisposed()){
            this.echartInstance.dispose();
        }
        this.echartInstance=initEChart(this.echartRef.current!,theme,opts);
        this.echartInstance.setOption(options);
    }
}