import React from 'react';
import { Layout, Button, Table, Row, Col, Select, Form, Upload,Icon,Card} from 'antd';
import {parse as parseXml} from 'fast-xml-parser';
import { RawDataRecord, convertRawRecord, DataRecord, createTableProps, createPieChartProps, createBarChartProps, createLineChartProps, toOption3D, toOption2D } from '../utils/data_utils';
import echarts from 'echarts';
import EChart from '../components/EChart';

import darkTheme from '../components/echart_dark_theme';

import line_1 from '../assets/images/line_1.png';
import line_2 from '../assets/images/line_2.png';
import line_3 from '../assets/images/line_3.png';
import line_4 from '../assets/images/line_4.png';
import line_5 from '../assets/images/line_5.png';
import line_6 from '../assets/images/line_6.png';
import line_7 from '../assets/images/line_7.png';
import line_8 from '../assets/images/line_8.png';
import line_9 from '../assets/images/line_9.png';
import line_10 from '../assets/images/line_10.png';
import bar_1 from '../assets/images/bar_1.png';
import bar_2 from '../assets/images/bar_2.png';
import bar_3 from '../assets/images/bar_3.png';
import pie_1 from '../assets/images/pie_1.png';
import pie_2 from '../assets/images/pie_2.png';
import table_1 from '../assets/images/table_1.png';

import testData from '../assets/testData';

const {Sider,Content}=Layout;
const Option=Select.Option;

export interface DataSource{
    key:string,
    name:string,
    data:any
}

export interface MainFrameState{
    readonly tableProps?:any,
    readonly lineChartProps?:any,
    readonly barChartProps?:any,
    readonly pieChartProps?:any,
    readonly data:any[],

    readonly selectedCard?:any,
    readonly currentDataSource?:string,
}

const SqureButton=(props:any)=>{
    return <button key={props.icon} style={{display:'inline-block',width:'3em',height:'3em',background:'#ffffff',borderRadius:'2px',border:'1px dashed #f0f0f0',padding:'0',margin:"0.25em",overflow:'hidden'}} onClick={props.onClick}>
        <img src={props.icon} style={{width:'100%',height:'100%',display:'block'}}/>
    </button>
}

export default class MainFrame extends React.Component<{},MainFrameState>
{
    private uploadProps:object;
    private dataMap:Map<string,DataSource>=new Map();

    constructor(props:any){
        super(props);
        this.uploadProps=this.getUploadProps();
        this.state={        
            tableProps:{
                rowGroupFields:['brand','type'],
                columnGroupFields:['year'],
                groupValueField:'name_model',
                sumFields:[],
                dataFields:['count','total'],
                type:1
            },
            pieChartProps:{
                typeField:"brand",
                type:1,
                defaultTheme:{
                    themeName:'pieChart',
                    color:['#17ad03','#8879db','#f5921f','#ed56fa','#e7eb2d','#ad7d03','#0f79e9','#f29fc6','#66d6f3'],
                }
            },
            barChartProps:{
                xField:"year_quarter",
                yField:"total",
                typeField:'type',
                type:1,
                defaultTheme:{
                    themeName:'barChart',
                    color:['#17ad03','#8879db','#f5921f','#ed56fa','#e7eb2d','#ad7d03','#0f79e9','#f29fc6','#66d6f3'],
                }
            },
            lineChartProps:{
                xField:"year_month",
                yFields:['count','total'],
                typeField:'',
                type:1,
                defaultTheme:{
                    themeName:'lineChart',
                    color:['#17ad03','#8879db','#f5921f','#ed56fa','#e7eb2d','#ad7d03','#0f79e9','#f29fc6','#66d6f3'],
                }
            },
            data:[]
        }
        setTimeout(()=>{
            this.addRawData('_','默认测试数据',testData);
        },1000)
    }

    addRawData(key:string,name:string,rawData:any[]){
        const data=rawData.map((raw:any)=>convertRawRecord(raw));
        this.dataMap.set(key,{key,name,data});
        this.selectData(key);
    }

    selectData(key:string){
       const dataSource=this.dataMap.get(key);
        if(dataSource){
            this.setNewState({data:dataSource.data,currentDataSource:key});
        }
    }

    getUploadProps(){
        const _this=this;
        return {
            beforeUpload(file:any) {
                const fileReader=new FileReader();
                fileReader.onloadend=function(event){
                    const xmlData=fileReader.result as string;
                    const rawObj=parseXml(xmlData,{
                        attributeNamePrefix:'',
                        parseAttributeValue:true,
                        parseNodeValue:true,
                        ignoreAttributes:false,
                        ignoreNameSpace:true,
                        allowBooleanAttributes:true,
                    });
                    const rows=rawObj.Grid.Body.B.I as RawDataRecord[];
                    _this.addRawData(file.uid,file.name,rows);
                };
        
                if(file instanceof Blob){
                    fileReader.readAsText(file);
                }else if(file.originFileObj && file.originFileObj instanceof Blob){
                    fileReader.readAsText(file.originFileObj);
                }
                return false;
            }
        }
    }

    setNewState(newState:object){
        this.setState({...this.state,...newState});
        this.setTableProps(this.state.tableProps);
        this.setBarChartProps(this.state.barChartProps);
        this.setLineChartProps(this.state.lineChartProps);
        this.setPieChartProps(this.state.pieChartProps);
    }


    setLineChartProps(newLineChartProps:any){

        let lineChartProps={...this.state.lineChartProps, ...newLineChartProps};
        lineChartProps={...lineChartProps, ...createLineChartProps(
            this.state.data,
            lineChartProps.xField,
            lineChartProps.yFields,
            lineChartProps.typeField
        ),theme:lineChartProps.defaultTheme};

        if(lineChartProps.xField=='date'&&lineChartProps.type<8){
            lineChartProps.xField='year_month';
        }

        switch(lineChartProps.type){
            case 1:
                lineChartProps.options.series.forEach((s:any)=>{
                    delete s.areaStyle;
                    s.smooth=false;
                    delete s.stack;
                });
                break;
            case 2:
                lineChartProps.options.series.forEach((s:any)=>{
                    s.areaStyle={};
                    s.smooth=false;
                    delete s.stack;
                });
                break;
            case 3:
                lineChartProps.options.series.forEach((s:any)=>{
                    delete s.areaStyle;
                    delete s.stack;
                    s.smooth=true;
                });
                break;
            case 4:
                lineChartProps.options.series.forEach((s:any)=>{
                    s.areaStyle={};
                    s.smooth=false;
                    s.stack='1'+s.yAxisIndex;
                });
                break;
            case 5:
                lineChartProps.theme=darkTheme;
                break;
            case 6:
                lineChartProps.options=toOption3D(lineChartProps.options);
                 break;
            case 7:
                lineChartProps.options.series.forEach((s:any,index:number)=>{
                    s.areaStyle={
                        color:new echarts.graphic.LinearGradient(
                            0,0,0.5,1,
                            [
                                {offset: 0.2, color: lineChartProps.theme.color[index]},
                                {offset: 1, color: '#000099'},
                            ])
                    };
                    s.smooth=false;
                    delete s.stack;
                });
            break;
        };

        this.setState({...this.state,lineChartProps});
    }

    setBarChartProps(newBarChartProps:any){
        let barChartProps={...this.state.barChartProps, ...newBarChartProps};
        barChartProps={...barChartProps, ...createBarChartProps(
            this.state.data,
            barChartProps.xField,
            barChartProps.yField,
            barChartProps.typeField
        ),theme:barChartProps.defaultTheme};

        barChartProps.options=toOption2D(barChartProps.options);
        const {options,type}=barChartProps;

        switch(type){
            case 1:
                options.series.forEach((s:any)=>{
                    s.itemStyle=undefined;
                });
                break;
            case 2:
                options.series.forEach((s:any,index:number)=>{
                    s.itemStyle={
                        color:new echarts.graphic.LinearGradient(
                            0,0,0.2,1,
                            [
                                {offset: 0.2, color: barChartProps.theme.color[index]},
                                {offset: 1, color: '#000099'},
                            ])
                    }
                });
                break;
            case 3:
                    barChartProps.options=toOption3D(options);
            break;
        }

        this.setState({...this.state,barChartProps});
    }

    setPieChartProps(newPieChartProps:any){
        let pieChartProps={...this.state.pieChartProps, ...newPieChartProps};
        pieChartProps={...pieChartProps, ...createPieChartProps(
            this.state.data,
            pieChartProps.typeField
        ),theme:pieChartProps.defaultTheme};

        const {options,type}=pieChartProps;

        switch(type){
            case 1:
                options.series[0].radius=['50%','75%']
                options.series[0].label.show=true;
                break;
            case 2:
                options.series[0].radius='75%'
                options.series[0].label.show=false;
                break;

        }
        this.setState({...this.state,pieChartProps});
    }

    setTableProps(newTableProps:any){
        let tableProps={...this.state.tableProps, ...newTableProps};
        
        tableProps={...tableProps, ...createTableProps(
            this.state.data,
            tableProps.rowGroupFields,
            tableProps.columnGroupFields,
            tableProps.groupValueField,
            tableProps.sumFields,
            tableProps.dataFields
        )};
        this.setState({...this.state,tableProps});
    }

    render(){

        const dataSourceOptions:any=[];
        this.dataMap.forEach(d=>{
            dataSourceOptions.push(<Option key={d.key} value={d.key}>{d.name}</Option>);
        })

        return (
            <Layout>
                <Sider width={220}>
                    <div style={{position:'fixed',top:'0',left:'0',width:'220px',height:"100vh",borderRight:'1px solid #ddd'}}>
                    <Card title="Chart Type" bordered={false} bodyStyle={{padding:'8px',background:"#f0f2f5"}} headStyle={{background:'#f0f2f5'}}>
                        <div>Line Chart</div>
                        <SqureButton icon={line_1}  onClick={()=>{
                            this.setLineChartProps({type:1});
                        }}/>
                        <SqureButton icon={line_2}  onClick={()=>{
                            this.setLineChartProps({type:2});
                        }}/>
                        <SqureButton icon={line_3}  onClick={()=>{
                            this.setLineChartProps({type:3});
                        }}/>
                        <SqureButton icon={line_4}  onClick={()=>{
                            this.setLineChartProps({type:4});
                        }}/>
                        <SqureButton icon={line_5}  onClick={()=>{
                            this.setLineChartProps({type:5});
                        }}/>
                        <SqureButton icon={line_6}  onClick={()=>{
                            this.setLineChartProps({type:6});
                        }}/>
                        <SqureButton icon={line_7}  onClick={()=>{
                            this.setLineChartProps({type:7});
                        }}/>
                        <SqureButton icon={line_8}  onClick={()=>{
                            this.setLineChartProps({type:8});
                        }}/>
                        <SqureButton icon={line_9}  onClick={()=>{
                            this.setLineChartProps({xField:'date',yFields:['total']});
                        }}/>
                        <SqureButton icon={line_10} onClick={()=>{
                            this.setLineChartProps({xField:'date',yFields:['count','total']});
                        }}/>
                        
                        <div>Bar Chart</div>
                        <SqureButton icon={bar_1}  onClick={()=>{
                            this.setBarChartProps({type:1});
                        }}/>

                        <SqureButton icon={bar_2} onClick={()=>{
                            this.setBarChartProps({type:2});
                        }}/>

                        <SqureButton icon={bar_3}  onClick={()=>{
                            this.setBarChartProps({type:3});
                        }}/>

                        <div>Pie Chart</div>
                        <SqureButton icon={pie_1} onClick={()=>{
                            this.setPieChartProps({type:1});
                        }}/>

                        <SqureButton icon={pie_2} onClick={()=>{
                            this.setPieChartProps({type:2});
                        }}/>

                        <div>Pivot Table</div>
                        <SqureButton icon={table_1} onClick={()=>{
                            const props={rowGroupFields:[],columnGroupFields:[],groupValueField:'brand',sumFields:[],dataFields:['brand','type','name_mode','count','price','color','trans','date']};
                            this.setTableProps(props);
                        }}/>
                    </Card>
                    </div>
                </Sider>

                <Content style={{padding:"0 24px"}}>
                    <Form>
                        <Row gutter={24}>
                            <Col span={8}>

                                <Form.Item label="数据源" labelCol={{span:4}} wrapperCol={{span:20}}>
                                    <Select value={this.state.currentDataSource} onChange={(value:string)=>{
                                        this.selectData(value);
                                    }}>
                                    {dataSourceOptions}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item wrapperCol={{span:24}}>
                                    <Upload {...this.uploadProps} showUploadList={false}>
                                        <Button block>
                                            <Icon type="upload" /> Upload Data File
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Row gutter={24}>
                        <Col span={24}>
                        <div id="table" className={"select-card-wrap"+(this.state.selectedCard=='table'?' selected':'')}>
                            <Card bordered={false}  bodyStyle={{padding:0,marginBottom:'24px'}} onClick={ ()=>this.setState({...this.state,selectedCard:'table'}) }>
                                <div style={{maxHeight:'300px',maxWidth:'100%',overflow:'auto'}}>
                                <Table {...this.state.tableProps} bordered size="small" pagination={false} tableLayout="auto"></Table>
                                </div>
                            </Card>
                        </div>
                        </Col>
                    </Row>

                    <div style={{background: 'url('+require('../assets/images/grid_bg.png')+') repeat left top' }}>
                    <Row gutter={24}> 
                        <Col span={12}>
                            {this.state.barChartProps.options&&(
                            <div className={"select-card-wrap"+(this.state.selectedCard=='barChart'?' selected':'')}>
                            <Card bordered={false} bodyStyle={{padding:0}} onClick={ ()=>this.setState({...this.state,selectedCard:'barChart'}) }>
                                <div style={{height:'30em'}}><EChart {...this.state.barChartProps}/></div>
                            </Card>
                            </div>
                            )}
                        </Col>
                        <Col span={12}>
                         {this.state.lineChartProps.options&&(
                            <div className={"select-card-wrap"+(this.state.selectedCard=='lineChart'?' selected':'')}>
                            <Card bordered={false}  bodyStyle={{padding:0}} onClick={ ()=>this.setState({...this.state,selectedCard:'lineChart'}) }>
                                <div style={{height:'30em'}}><EChart {...this.state.lineChartProps}/></div>
                            </Card>
                            </div>
                            )}
                        </Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={8}>
                        {this.state.pieChartProps.options&&(
                            <div className={"select-card-wrap"+(this.state.selectedCard=='pieChart'?' selected':'')}>
                            <Card bordered={false} hoverable bodyStyle={{padding:0}} onClick={ ()=>this.setState({...this.state,selectedCard:'pieChart'}) }>
                                <div style={{height:'30em'}}><EChart {...this.state.pieChartProps}/></div>
                            </Card>
                            </div>
                            )}
                        </Col>
                    </Row>
                    </div>
                </Content>
                <Sider width={180} style={{background:"#ffffff"}}>
                    <div style={{position:'fixed',top:0,right:0,width:180,height:"100vh",borderLeft:'1px solid #ddd'}}>
                    <Card title="Properties" bordered={false}>
                        {this.state.selectedCard==='table'&&(
                        <Form>
                            <Form.Item label="Column Fields">
                                <Select value={this.state.tableProps.columnGroupFields.join(',')} onChange={(value:any)=>{
                                    const tableProps:any={columnGroupFields:value?value.split(','):[]};
                                    if(value==='year_month'||value==="year_quarter"||!value){
                                        tableProps.rowGroupFields=['brand','type'];
                                        tableProps.groupValueField='name_model';
                                    }else if(value==='brand'||value==="type"){
                                        tableProps.rowGroupFields=['year','month'];
                                        tableProps.groupValueField='date';
                                    }
                                    if(!value){
                                        tableProps.dataFields=['price','color','trans','date'];
                                        tableProps.sumFields=['count','total'];
                                    }

                                    this.setTableProps(tableProps);
                                }}>
                                    <Option value="">=Nothing=</Option>

                                    <Option value="year_quarter">Quarter</Option>
                                    <Option value="year_month">Month</Option>

                                    <Option value="brand">Brand</Option>
                                    <Option value="type">Type</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Rows Fields">
                                <Select value={[...this.state.tableProps.rowGroupFields,this.state.tableProps.groupValueField].join(',')}>
                                    <Option value="brand,type,name_model">Brand,Type</Option>
                                    <Option value="year,month,date">Year,Month</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="Data Fields">
                                <Select value={[...this.state.tableProps.sumFields,...this.state.tableProps.dataFields].join(',')} onChange={(value:any)=>{
                                    this.setTableProps({
                                        sumFields:value.split(',').filter((e:any)=>e==='total'||e==='count'),
                                        dataFields:value.split(',').filter((e:any)=>e!=='total'&&e!=='count')
                                    });
                                }}>
                                    <Option value="count,price">Count,Price</Option>
                                    <Option value="count,total">Count,Total</Option>
                                    <Option value="count">Count</Option>
                                    <Option value="total">Total</Option>
                                    <Option value="count,price,color,trans,date">Total</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        )}

                        {this.state.selectedCard==='barChart'&&(
                        <Form>
                            <Form.Item label="y轴数据">
                                <Select value={this.state.barChartProps.yField} onChange={(value:any)=>{
                                    this.setBarChartProps({yField:value});
                                }}>
                                    <Option value="total">Total</Option>
                                    <Option value="count">Count</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="x轴数据">
                                <Select value={this.state.barChartProps.xField} onChange={(value:any)=>{
                                    this.setBarChartProps({xField:value});
                                }}>
                                    <Option value="year_month">Month</Option>
                                    <Option value="year_quarter">Quarter</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="数据类型">
                                <Select value={this.state.barChartProps.typeField} onChange={(value:any)=>{
                                    this.setBarChartProps({typeField:value});
                                }}>
                                    <Option value="">All</Option>
                                    <Option value="brand">Brand</Option>
                                    <Option value="type">Type</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        )}

                        {this.state.selectedCard==='lineChart'&&(
                        <Form>
                            <Form.Item label="y轴数据">
                                <Select value={this.state.lineChartProps.yFields.join(',')} onChange={(value:any)=>{
                                    this.setLineChartProps({yFields:value.split(',')});
                                }}>
                                    <Option value="count,total">Total,Count</Option>
                                    <Option value="total">Total</Option>
                                    <Option value="count">Count</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="x轴数据">
                                <Select value={this.state.lineChartProps.xField} onChange={(value:any)=>{
                                    this.setLineChartProps({xField:value});
                                }}>
                                    <Option value="year_quarter">Quarter</Option>
                                    <Option value="year_month">Month</Option>
                                    <Option value="date">Date</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item label="数据类型">
                                <Select value={this.state.lineChartProps.typeField} onChange={(value:any)=>{
                                    this.setLineChartProps({typeField:value});
                                }}>
                                    <Option value="">All</Option>
                                    <Option value="brand">Brand</Option>
                                    <Option value="type">Type</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        )}

                        {this.state.selectedCard==='pieChart'&&(
                        <Form>
                            <Form.Item label="数据类型">
                                <Select value={this.state.pieChartProps.typeField} onChange={(value:any)=>{
                                    this.setPieChartProps({typeField:value});
                                }}>
                                    <Option value="brand">Brand</Option>
                                    <Option value="type">Type</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        )}

                    </Card>
                    </div>
                </Sider>
            </Layout>
        );
    }
}