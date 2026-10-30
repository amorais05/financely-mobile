import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { FinancialReminder } from '../components/FinancialReminder';
import { theme } from '../constants/theme';
import { restoreSession } from '../services/auth';
import { brl, listTransactions, type FinancialTransaction } from '../services/financial';
export default function CalendarScreen() {
 const [items,setItems]=useState<FinancialTransaction[]>([]);const [date,setDate]=useState(new Date());const [selected,setSelected]=useState(new Date().getDate());const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const s=await restoreSession();if(!s)throw new Error('Faça login novamente.');setItems(await listTransactions(s));}catch(e){setError(e instanceof Error?e.message:'Falha ao carregar lançamentos.');}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 const year=date.getFullYear(),month=date.getMonth(),first=new Date(year,month,1).getDay(),last=new Date(year,month+1,0).getDate();
 const iso=`${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`;
 const dayItems=useMemo(()=>items.filter(i=>String(i.data_transacao).slice(0,10)===iso),[items,iso]);
 const move=(step:number)=>{setDate(new Date(year,month+step,1));setSelected(1);};
 return <ScreenLayout title="Calendário financeiro" description="Encontre movimentações pela data."><View style={styles.stack}>
 <View style={styles.monthRow}><Pressable onPress={()=>move(-1)}><Text style={styles.arrow}>‹</Text></Pressable><Text style={styles.title}>{date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</Text><Pressable onPress={()=>move(1)}><Text style={styles.arrow}>›</Text></Pressable></View>
 <View style={styles.days}>{['D','S','T','Q','Q','S','S'].map((d,i)=><Text key={i} style={styles.weekday}>{d}</Text>)}
 {Array.from({length:first},(_,i)=><View key={`pad${i}`} style={styles.cell}/>)}
 {Array.from({length:last},(_,i)=>i+1).map(d=>{const key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const has=items.some(i=>String(i.data_transacao).slice(0,10)===key);return <Pressable key={d} onPress={()=>setSelected(d)} style={[styles.cell,d===selected&&styles.selected]}><Text style={[styles.day,d===selected&&styles.selectedText]}>{d}</Text>{has?<View style={styles.dot}/>:null}</Pressable>;})}</View>
 <Pressable onPress={()=>void load()}><Text style={styles.link}>↻ Atualizar lançamentos</Text></Pressable>
 {loading?<ActivityIndicator color={theme.primary}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
 <Text style={styles.section}>Movimentações de {String(selected).padStart(2,'0')}/{String(month+1).padStart(2,'0')}/{year}</Text>
 {!loading&&dayItems.length===0?<Text style={styles.muted}>Nenhuma movimentação nesta data.</Text>:null}
 {dayItems.map(i=><View key={i.id_transacao} style={styles.line}><Text style={styles.name}>{i.descricao}</Text><Text style={{color:Number(i.valor)<0?theme.expense:theme.income,fontWeight:'800'}}>{brl(i.valor)}</Text></View>)}
 <Text style={styles.section}>Lembretes</Text><FinancialReminder/>
 <Text style={styles.muted}>Para editar um lançamento, abra a aba Lançamentos.</Text>
 </View></ScreenLayout>;
}
const styles=StyleSheet.create({stack:{gap:16},monthRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},arrow:{fontSize:34,color:theme.primary,paddingHorizontal:10},title:{fontSize:17,fontWeight:'800',color:theme.text,textTransform:'capitalize'},days:{flexDirection:'row',flexWrap:'wrap'},weekday:{width:'14.2857%',textAlign:'center',fontWeight:'800',color:theme.muted,paddingVertical:12},cell:{width:'14.2857%',height:44,alignItems:'center',justifyContent:'center',borderRadius:10},selected:{backgroundColor:theme.primary},day:{color:theme.text,fontWeight:'600'},selectedText:{color:theme.white},dot:{width:5,height:5,borderRadius:3,backgroundColor:theme.income},section:{color:theme.text,fontWeight:'800',fontSize:16},line:{padding:10,borderBottomWidth:1,borderColor:theme.border,flexDirection:'row',justifyContent:'space-between',gap:8},name:{color:theme.text,flex:1},link:{color:theme.primary,fontWeight:'700'},error:{color:theme.expense},muted:{color:theme.muted}});
