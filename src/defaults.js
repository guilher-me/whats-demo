(function(){
 const radio=(name,label,values)=>({type:'RadioButtonsGroup',name,label,required:true,'data-source':values.map(([id,title])=>({id,title}))});
 const footer=(label,name,next,payload)=>({type:'Footer',label,'on-click-action':{name,...(next?{next:{type:'screen',name:next}}:{}),payload}});
 const screen=(id,title,children,terminal=false,data={})=>({id,title,terminal,data,layout:{type:'SingleColumnLayout',children}});
 const identity={version:'7.3',screens:[screen('IDENTIFICATION_SCREEN','Prevent Senior',[
  {type:'TextHeading',text:'Identificação'},{type:'TextBody',text:'Para iniciar, confirme seus dados e o aceite da nossa Política de Privacidade.'},
  {type:'CheckboxGroup',name:'terms',label:'Termos de Uso',required:true,'data-source':[{id:'accepted',title:'Li e aceito os termos.'}]},
  {type:'TextInput',name:'document',label:'CPF ou Matrícula',required:true,'input-type':'number','min-chars':5,'max-chars':11,'helper-text':'Digite apenas números, entre 5 e 11 dígitos.'},
  {type:'DatePicker',name:'birth',label:'Data de Nascimento',required:true,'helper-text':'Informe sua data de nascimento.'},
  footer('Confirmar Dados','complete',null,{document:'${form.document}',birth:'${form.birth}',terms:'${form.terms}'})
 ],true)]};
 const menu={version:'7.3',routing_model:{MENU_SCREEN:['AGENDAMENTO_SCREEN'],AGENDAMENTO_SCREEN:['CANAL_SCREEN']},screens:[
  screen('MENU_SCREEN','Atendimento',[radio('main_option','Como posso te ajudar?',[['financeiro','Assuntos Financeiros'],['agendamento','Agendamento'],['documentos','Envio de documentos'],['fale_conosco','Fale conosco'],['urgencia','Urgência/Emergência']]),footer('Avançar','navigate','AGENDAMENTO_SCREEN',{main_option:'${form.main_option}'})]),
  screen('AGENDAMENTO_SCREEN','Agendamento',[{type:'If',condition:"${data.main_option} == 'agendamento'",then:[radio('agendamento_option','Qual agendamento deseja?',[['consultas','Agendar Consultas'],['exames','Exames ou Procedimentos'],['credenciada','Rede Credenciada'],['confirmar','Confirmar Agendamento'],['cancelar','Cancelar Consulta/Exame']])],else:[{type:'TextHeading',text:'Informações Recebidas'},{type:'TextBody',text:'Clique em avançar para definir o canal de atendimento da sua solicitação.'}]},footer('Avançar','navigate','CANAL_SCREEN',{main_option:'${data.main_option}',agendamento_option:'${form.agendamento_option}'})],false,{main_option:{type:'string',_example_:'agendamento'}}),
  screen('CANAL_SCREEN','Finalização',[{type:'TextHeading',text:'Canal de Atendimento'},{type:'TextBody',text:'Como você prefere seguir com o seu atendimento?'},radio('canal_option','Escolha uma opção:',[['portal','Autoatendimento no Portal'],['aguardar','Aguardar Atendente']]),footer('Enviar Solicitação','complete',null,{assunto_principal:'${data.main_option}',tipo_agendamento:'${data.agendamento_option}',preferencia_canal:'${form.canal_option}'})],true,{main_option:{type:'string',_example_:'agendamento'},agendamento_option:{type:'string',_example_:'consultas'}})
 ]};
 window.FakeFlowsDefault=()=>({version:1,contact:{name:'Prevent Senior',avatar:'assets/prevent-senior.png',verified:true},steps:[
  {id:'hello',type:'user',text:'oi',delay:.4},
  {id:'identity',type:'flow',text:'Olá! Para iniciar seu atendimento, confirme seus dados e o aceite dos termos.',delay:1,typing:true,label:'Confirmar meus dados',completion:'Identificação confirmada',flow:identity,answers:{terms:['accepted'],document:'12345',birth:'1980-01-01'}},
  {id:'menu',type:'flow',text:'Obrigada por confirmar seus dados. Como podemos ajudar?',delay:1,typing:true,label:'Iniciar atendimento',completion:'Solicitação enviada',flow:menu,answers:{main_option:'agendamento',agendamento_option:'consultas',canal_option:'aguardar'}},
  {id:'protocol',type:'business',text:'Seu protocolo de atendimento é 202610290001.\nAguarde um instante. Vamos conectar você a uma atendente.',delay:1.5,typing:true},
  {id:'agent',type:'business',text:'Olá! Seja bem-vindo ao WhatsApp da Prevent Senior.\nMeu nome é Vanessa e vou realizar o seu atendimento.',delay:6.5,typing:true}
 ]});
})();
