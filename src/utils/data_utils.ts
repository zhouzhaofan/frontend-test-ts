import {parse as parseXml} from 'fast-xml-parser';
import numeral from 'numeral';
import { awaitExpression } from '@babel/types';
import { Children } from 'react';

export interface RawDataRecord{
    BRAND:string,
    TYPE:string,
    NAME:string,
    MODEL:string,
    TRANS:string,
    COLOR:string,
    PRICE:string|number,
    COUNT:string|number,
    DATE:string
}

export interface DataRecord {
    brand:string,
    type:string,
    name:string,
    model:string,
    trans:string,
    color:string,
    price:number,
    count:number,
    date:number,

    name_model:string,
    total:number,

    year:number,
    month:number,
    year_quarter:number,
    year_month:number,
    children?:(DataRecord)[],
    key?:string
}

export function arrayFromSet<T>(set:Set<T>):T[]{
    const arr:T[]=[];
    set.forEach(v=>arr.push(v));
    return arr;
}

export function arrayUnique<T>(array:T[]):T[]{
    return arrayFromSet(new Set(array));
}


export function groupBy<T>(data:T[],groupFields:(keyof T)[],valueField?:(keyof T)){
    if(groupFields.length===0){
        return {children:data.map((record,rowIndex)=>({...record,key:rowIndex})),key:'',$name:'_'};
    }

    const fields=groupFields;
    const groupRecord:any={children:[],$group:fields[0],key:'',$name:'_'};
    data.forEach((record,rowIndex)=>{
        let tmpGroupRecord=groupRecord;
        fields.forEach((field,index)=>{
            const key=(tmpGroupRecord.key||'/')+record[field]+'/';
            if(!tmpGroupRecord[key]){
                let newGroupRecord:any={children:[],key,$name:record[field],$field:field};
                if(valueField){
                    newGroupRecord[valueField]=record[field];
                }

                if(index<fields.length-1){
                    newGroupRecord.$group=fields[index+1];
                }

                tmpGroupRecord.children.push(newGroupRecord);
                tmpGroupRecord[key]=newGroupRecord;
            }
            tmpGroupRecord=tmpGroupRecord[key];
        });
        tmpGroupRecord.children.push({...record,key:tmpGroupRecord.key+rowIndex});
    });
    
    return groupRecord;
}

export function sum<T>(groupRecord:any,sumFields:(keyof T)[]){
    if(sumFields.length===0){
        return groupRecord;
    }

    if(groupRecord.children){
        sumFields.forEach(field=>{
            groupRecord[field]=0;
        });

        groupRecord.children.reduce((sumData:any,record:any)=>{
            if(record.children){
                sum(record,sumFields);
            }

            sumFields.forEach(field=>{
                sumData[field]+=parseInt(record[field])||0;
            });
            return sumData;
        },groupRecord);
    }

    return groupRecord;
}

export function createTableColumns<T>(data:T[],
    columnGroupFields:(keyof T)[],
    dataFields:(keyof T)[]=[],
    otherFields:(keyof T)[]=[]){

    if(columnGroupFields.length===0){
        return arrayUnique([...otherFields,...dataFields]).map(field=>({title:field,dataIndex:field}));
    }

    const createColumn0=(record:any)=>{
        if(record.$group){
            return {title:record.$name, key:record.key, children:record.children.map(createColumn0).sort()};
        }else {
            const column:any={title:record.$name, key:record.key};
            if(dataFields.length>0){
                column.children=dataFields.map(field=>{return {title:field,dataIndex:record.key+field,key:record.key+field}} );
            }else{
                column.dataIndex=record.$field;
            }
            return column;
        }
    };

    const baseColumns=otherFields.map(field=>({title:field,dataIndex:field,key:field}));
    const columns=[...baseColumns,...createColumn0(groupBy(data,columnGroupFields)).children];

    return columns;
}

export function trimLeft(input:string,chars:string='\n\r\t '){
    if(!input){
        return input;
    }

    for(let i=0;i<input.length;i++){
        if(chars.indexOf(input[i])<0){
            return input.substring(i);
        }
    }
    return '';
}

export function trimRight(input:string,chars:string='\n\r\t '){
    if(!input){
        return input;
    }

    for(let i=input.length-1;i>=0;i--){
        if(chars.indexOf(input[i])<0){
            return input.substring(0,i+1);
        }
    }
    return '';
}

export function trim(input:string,chars:string='\n\r\t '){
    return trimLeft(trimRight(input,chars),chars);
}

export function createTableProps<T>(
    data:T[],
    rowGroupFields:(keyof T)[],
    columnGroupFields:(keyof T)[],
    groupValueField:(keyof T),
    sumFields:(keyof T)[]=[],
    dataFields:(keyof T)[]=[]){
    

    const columns=createTableColumns(data,columnGroupFields,[...dataFields,...sumFields],[groupValueField]);
    if(columnGroupFields.length===0&&rowGroupFields.length===0){
        return {columns,dataSource:data.map((record,rowIndex)=>({...record,key:rowIndex}))};
    }else if(columnGroupFields.length===0){
        return {columns,dataSource:sum(groupBy(data,[...rowGroupFields,groupValueField],groupValueField),sumFields).children}
    }

    const colFlatFunc=(groupRecord:any)=>{
        if(columnGroupFields.includes(groupRecord.$group)){
            return groupRecord.children.flatMap(colFlatFunc);
        }else{
            return [groupRecord]
        }
    };

    const rowFlatFunc=(groupRecord:any)=>{
        if(rowGroupFields.includes(groupRecord.$group)||groupRecord.$group===groupValueField){
            return groupRecord.children.flatMap(rowFlatFunc);
        }else {
            return [groupRecord]
        }
    };

    const flatFunc=(groupRecord:any)=>{
        if(!groupRecord.$group){
            return [groupRecord];
        }else{
            return groupRecord.children.flatMap(flatFunc);
        }
    };

   const colRecords=sum(groupBy(data,[...columnGroupFields, ...rowGroupFields, groupValueField]),sumFields).children.flatMap(colFlatFunc);
   const rowRecords=sum(groupBy(data,[...rowGroupFields,groupValueField, ...columnGroupFields]),sumFields).children.flatMap(rowFlatFunc)
   
    colRecords.forEach((r:any)=> {
        flatFunc(r).forEach((c:any)=>r[c.key]=c);
    });

    rowRecords.forEach((r:any)=> {
        flatFunc(r).forEach((c:any)=>r[c.key]=c);
    });

    const copyFields=[...rowGroupFields,groupValueField];
    const groupData=groupBy(rowRecords.map((row:any)=> {
        const newRow:any={key:row.key};
        colRecords.forEach((col:any)=> {
            const key1=col.key+trimLeft(row.key,'/');
            const key2=row.key+trimLeft(col.key,'/');

            if(col[key1]){
                sumFields.forEach(field=>{
                    newRow[col.key+field]=col[key1][field];
                });
    
                dataFields.forEach(field=>{
                    newRow[col.key+field]=col[key1].children?col[key1].children[0][field]:col[key1][field];
                });

                copyFields.forEach(field=>{
                    newRow[field]=col[key1].children?col[key1].children[0][field]:col[key1][field];
                });
           }
            
            if(row[key2]){
                copyFields.forEach(field=>{
                    newRow[field]=row[key2].children?row[key2].children[0][field]:row[key2][field];
                });
            }
       });
    
       return newRow;
   }),rowGroupFields,groupValueField);
   
    return {columns,dataSource:groupData.children};
}


export function convertRawRecord(raw:RawDataRecord):DataRecord{
    const [month,date,year]=raw.DATE.split('/').map(v=>parseInt(v));

    return {
        brand:raw.BRAND,
        type:raw.TYPE,
        name:raw.NAME,
        model:raw.MODEL,
        name_model:raw.NAME+'_'+raw.MODEL,
        trans:raw.TRANS,
        color:raw.COLOR,
        price:parseInt(''+raw.PRICE),
        count:parseInt(''+raw.COUNT),
        total:parseInt(''+raw.PRICE)*parseInt(''+raw.COUNT),
        date:year*10000+month*100+date,
        year:year,
        month:month,
        year_quarter:year*10+Math.floor((month-1)/3)+1,
        year_month:year*100+month
    };
}


export function handleXmlData(xmlData:string):DataRecord[]{
    const rawObj=parseXml(xmlData,{
        attributeNamePrefix:'',
        parseAttributeValue:true,
        parseNodeValue:true,
        ignoreAttributes:false,
        ignoreNameSpace:true,
        allowBooleanAttributes:true,
    });
    const rows=rawObj.Grid.Body.B.I as RawDataRecord[];
    return rows.map(rawRecord=>convertRawRecord(rawRecord));
}



export function createPieChartProps<T>(data:T[],type:(keyof T)){
    const groupData=sum(groupBy(data,[type]),['count','total']);

    const options={
        title:{
            text:'Production Sales Share',
            top:'8',
            left:'8',
        },

        grid:{
            top:80
        },

        tooltip:{
            trigger:'item',
            padding:16,
            formatter(a:any){
               return a.name+"<br>"+
                "Counts: "+a.data.count+"<br>"+
                "Amount: $"+numeral(a.data.total).format()+"<br>"+
                "Proportion: "+a.percent.toFixed(1)+"%";
            }
        },
        series:[
            {
                name:type,
                type:'pie',
                radius:['45%','75%'],
                avoidLabelOverlap:false,
                label:{
                    show:true,
                    position:'center',
                    formatter(a:any){
                        const sumTotal=numeral(groupData.total)
                        return '{h|$'+sumTotal.format()+'}\n{p|Total Price}';
                    },

                    rich:{
                        h:{
                          fontSize:18,
                          color:'#333333',
                          lineHeight:50,
                          fontWeight:'bold'
                        },
                        p:{
                           color:'#999999',
                           fontSize:14
                        }
                     }
                },
                labelLine:{
                    normal:{
                        show:false
                    }
                },
                data: groupData.children.map((e:any)=>({value:e.total,name:e.$name,count:e.count,total:e.total}))
            }
        ]
    };

    return {options};
}

export function createBarChartProps<T>(data:T[],x:(keyof T),y:(keyof T),type?:(keyof T)){
    const xRecords=type ? sum(groupBy(data,[x,type]),[y]) : sum(groupBy(data,[x]),[y]);
    const typeRecords=type? sum(groupBy(data,[type,x]),[y]): {children:[{$name:''}]};


    const options={
        title:{
            text:'Production Type Analysis',
            top:'8',
            left:'8'
        },

        tooltip:{
            trigger:'axis',
            padding:16,
            axisPointer:{
                type:'shadow'
            }
        },

        grid:{
            top:100,
            left:80
        },

        legend:{
            top:40,
            show:true
        },

        xAxis:{
            type:'category',
            data: xRecords.children.map((xRecord:any)=>xRecord.$name)
        },
        yAxis:{
            type:'value'
        },
        series:[
            ...typeRecords.children.map( (typeRecord:any)=>({
                type: 'bar',
                name: typeRecord.$name||y,
                data: xRecords.children.map((xRecord:any)=>{
                    if(type){
                        const key=(xRecord.key||'/')+typeRecord.$name+'/';
                        return xRecord[key]?xRecord[key][y]:0;
                    }else{
                        return xRecord[y];
                    }
                })
            }) )
        ]
    };

    return {options};
}

export function createLineChartProps<T>(data:T[],x:(keyof T),yFields:(keyof T)[],type?:(keyof T)){
    const xRecords=type ? sum(groupBy(data,[x,type]),yFields) : sum(groupBy(data,[x]),yFields);
    const typeRecords=type? sum(groupBy(data,[type,x]),yFields): {children:[{$name:''}]}

    const options={
        title:{
            text:'Sales Trend',
            top:'8',
            left:'8'
        },
        grid:{
            top:100,
            left:80,
            right:80
        },

        tooltip:{
            trigger:'axis',
            padding:16
        },

        legend:{
            top:40,
            show:true
        },

        xAxis:[{
            type:'category',
            data: xRecords.children.map((xRecord:any)=>xRecord.$name)
        }],

        yAxis:yFields.map(y=>({id:y,name:y,type:'value'})),

        series:[
            ...yFields.flatMap((y,index)=>[
                ...typeRecords.children.map( (typeRecord:any)=>({
                    type: 'line',
                    yAxisIndex:index,
                    name: typeRecord.$name||y,
                    data: xRecords.children.map((xRecord:any)=>{
                        if(type){
                            const key=(xRecord.key||'/')+typeRecord.$name+'/';
                            return xRecord[key]?xRecord[key][y]:0;
                        }else{
                            return xRecord[y];
                        }
                    })
                }) )
            ])
        ]
    };

    return {options};
}

export function toOption2D(option3D:any){
    return option3D.option2D||option3D;
}

export function toOption3D(option2D:any){
    const {title,legend,series}=option2D;
    const option3D= {
        option2D,
        tooltip:{},
        grid3D:{
            boxDepth:10,
            boxWidth:150,
            boxHeight:90,
            viewControl:{
                alpha:5,
                minAlpha:0,
                maxAlpha:10,
                beta:15,
                minBeta:0,
                maxBeta:20,
                distance:150
            }
        },
        xAxis3D: {
            name:'',
            type:'category',
            data:option2D.xAxis.data,
            splitLine:{
                show:false
            }
        },

        yAxis3D: {
            type: 'category',
            data:[''],
            name:'',
            show:false,
            splitLine:{
                show:false
            }
        },

        zAxis3D: {
            type: 'value',
            name:''
        },
        title,legend,series:series.map((s:any)=>(
            {...s,data:s.data.map((v:any,i:number)=>([i,0,v])),shading:'lambert',stack:'1',type:s.type+'3D'}
        ))
    }

    return  option3D;
}