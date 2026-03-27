import { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════
//  HELPERS & CONSTANTES
// ══════════════════════════════════════════════════════════════
const IVA = 0.10;
const fmtGs  = (n) => `Gs. ${Math.round(Number(n)||0).toLocaleString("es-PY")}`;
const fmtFec = (d) => new Date(d).toLocaleString("es-PY",{dateStyle:"short",timeStyle:"short"});
const fmtFecC= (d) => new Date(d).toLocaleDateString("es-PY");
const genId  = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hoy    = () => new Date().toISOString();
const ivaInc = (p) => ({ base: p/(1+IVA), iva: p - p/(1+IVA) });

// PPP — Precio Promedio Ponderado
const calcPPP = (historialCompras) => {
  const total = historialCompras.reduce((s,c) => s + c.cantidad, 0);
  if(!total) return 0;
  return historialCompras.reduce((s,c) => s + c.precioUnitario * c.cantidad, 0) / total;
};

const RUBROS = ["Bebidas","Gaseosas","Agua","Jugos","Cervezas","Energizantes","Deportivas","Tés",
                "Comidas","Pizzas","Hamburguesas","Papas Fritas","Lomitos","Parrilla","Pollo","Picadas",
                "Tabaco","Cigarrillos","Vapers/Pods","Otros"];

const PROD_INIT = [
  {id:1, nombre:"Coca-Cola 600ml",      rubro:"Gaseosas",    precio:3500,  costo:2000, stock:48, stockMin:10, imagen:"🥤", disponible:true, historialCompras:[]},
  {id:2, nombre:"Pepsi 600ml",           rubro:"Gaseosas",    precio:3200,  costo:1900, stock:36, stockMin:8,  imagen:"🥤", disponible:true, historialCompras:[]},
  {id:3, nombre:"Sprite 600ml",          rubro:"Gaseosas",    precio:3200,  costo:1900, stock:24, stockMin:8,  imagen:"🥤", disponible:true, historialCompras:[]},
  {id:4, nombre:"Agua Mineral 500ml",    rubro:"Agua",        precio:2000,  costo:800,  stock:100,stockMin:20, imagen:"💧", disponible:true, historialCompras:[]},
  {id:5, nombre:"Agua con Gas 500ml",    rubro:"Agua",        precio:2200,  costo:900,  stock:60, stockMin:10, imagen:"💧", disponible:true, historialCompras:[]},
  {id:6, nombre:"Jugo Naranja 1L",       rubro:"Jugos",       precio:6500,  costo:4000, stock:20, stockMin:5,  imagen:"🍊", disponible:true, historialCompras:[]},
  {id:7, nombre:"Jugo Mango 1L",         rubro:"Jugos",       precio:6500,  costo:4000, stock:18, stockMin:5,  imagen:"🥭", disponible:true, historialCompras:[]},
  {id:8, nombre:"Cerveza Brahma 600ml",  rubro:"Cervezas",    precio:8000,  costo:5000, stock:30, stockMin:6,  imagen:"🍺", disponible:true, historialCompras:[]},
  {id:9, nombre:"Cerveza Heineken 330ml",rubro:"Cervezas",    precio:9000,  costo:5500, stock:24, stockMin:6,  imagen:"🍺", disponible:true, historialCompras:[]},
  {id:10,nombre:"RedBull 250ml",         rubro:"Energizantes",precio:12000, costo:8000, stock:15, stockMin:4,  imagen:"⚡", disponible:true, historialCompras:[]},
  {id:11,nombre:"Gatorade 500ml",        rubro:"Deportivas",  precio:5500,  costo:3500, stock:22, stockMin:5,  imagen:"🏃", disponible:true, historialCompras:[]},
  {id:12,nombre:"Té Helado Lipton 500ml",rubro:"Tés",         precio:4500,  costo:2800, stock:28, stockMin:6,  imagen:"🍵", disponible:true, historialCompras:[]},
  {id:13,nombre:"Pizza Muzzarella",      rubro:"Pizzas",      precio:35000, costo:18000,stock:20, stockMin:3,  imagen:"🍕", disponible:false, historialCompras:[]},
  {id:14,nombre:"Hamburguesa Clásica",   rubro:"Hamburguesas",precio:22000, costo:10000,stock:15, stockMin:3,  imagen:"🍔", disponible:false, historialCompras:[]},
  {id:15,nombre:"Cigarrillo Marlboro",   rubro:"Cigarrillos", precio:15000, costo:9000, stock:30, stockMin:5,  imagen:"🚬", disponible:false, historialCompras:[]},
];

const FUNC_INIT = [
  {id:"f1",nombre:"Ana García",   cargo:"Cajera",    salario:2500000,activo:true,adelantos:[]},
  {id:"f2",nombre:"Carlos Méndez",cargo:"Repartidor",salario:2000000,activo:true,adelantos:[]},
  {id:"f3",nombre:"María López",  cargo:"Vendedora", salario:2200000,activo:true,adelantos:[]},
];
const PROV_INIT = [
  {id:"p1",nombre:"Distribuidora Norte SA",ruc:"80012345-1",telefono:"0981-111222",email:"norte@dist.com",saldo:0,pagos:[],compras:[]},
  {id:"p2",nombre:"Bebidas del Paraguay",  ruc:"80098765-3",telefono:"0985-333444",email:"bpy@bebidas.com",saldo:0,pagos:[],compras:[]},
];
const CLIENTES_INIT = [
  {id:"c1",nombre:"Juan Pérez",         ruc:"1234567-8",telefono:"0981555666",email:"juan@mail.com", direccion:"Av. Principal 123",credito:0,compras:[],tipoCliente:"minorista"},
  {id:"c2",nombre:"Supermercado El Ahorro",ruc:"80055432-2",telefono:"021777888",email:"ahorro@super.com",direccion:"Calle 4 de Julio 456",credito:0,compras:[],tipoCliente:"mayorista"},
];

// ══════════════════════════════════════════════════════════════
//  ROOT
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [vista,      setVista]      = useState("dashboard");
  const [productos,  setProductos]  = useState(PROD_INIT);
  const [ventas,     setVentas]     = useState([]);
  const [compras,    setCompras]    = useState([]);
  const [consignaciones, setConsignaciones] = useState([]);
  const [devoluciones,setDevoluciones]=useState([]);
  const [caja,       setCaja]       = useState({abierta:false,saldoInicial:0,apertura:null,movimientos:[],turnos:[]});
  const [pedidosD,   setPedidosD]   = useState([]);
  const [carrito,    setCarrito]    = useState([]);
  const [clienteAct, setClienteAct] = useState({nombre:"",telefono:"",direccion:"",tipo:"mostrador",id:null});
  const [funcionarios,setFuncionarios]=useState(FUNC_INIT);
  const [proveedores, setProveedores]=useState(PROV_INIT);
  const [clientes,   setClientes]   = useState(CLIENTES_INIT);
  const [gastosFijos,setGastosFijos]=useState([
    {id:"gf1",concepto:"Alquiler local",monto:2000000,frecuencia:"mensual",categoria:"alquiler",activo:true},
    {id:"gf2",concepto:"Luz eléctrica", monto:500000, frecuencia:"mensual",categoria:"servicios",activo:true},
  ]);
  const [gastosVar,  setGastosVar]  = useState([]);
  const [promos,     setPromos]     = useState([]);
  const [metas,      setMetas]      = useState({diaria:500000,semanal:3000000});
  const [usuarioActual,setUsuarioActual]=useState("Admin");
  const [notif,      setNotif]      = useState(null);
  const [alertas,    setAlertas]    = useState([]);

  const notificar=(msg,tipo="success")=>{setNotif({msg,tipo});setTimeout(()=>setNotif(null),3200);};

  // ── ALERTAS DE STOCK ──
  useEffect(()=>{
    const bajos=productos.filter(p=>p.disponible&&p.stock<=p.stockMin);
    setAlertas(bajos.map(p=>({id:p.id,tipo:"stock",msg:`Stock bajo: ${p.nombre} (${p.stock} restantes)`,prod:p})));
  },[productos]);

  // ── CARRITO ──
  const addCarrito=(prod)=>{
    if(!caja.abierta){notificar("Abra la caja primero","error");return;}
    if(prod.stock<=0){notificar("Sin stock","error");return;}
    setCarrito(prev=>{
      const ex=prev.find(i=>i.id===prod.id);
      if(ex){if(ex.cantidad>=prod.stock){notificar("Stock insuficiente","error");return prev;}return prev.map(i=>i.id===prod.id?{...i,cantidad:i.cantidad+1}:i);}
      return [...prev,{...prod,cantidad:1,descuento:0}];
    });
  };
  const cambiarQty=(id,d)=>setCarrito(p=>p.map(i=>i.id===id?{...i,cantidad:Math.max(1,i.cantidad+d)}:i));
  const quitarItem=(id)=>setCarrito(p=>p.filter(i=>i.id!==id));
  const aplicarDesc=(id,pct)=>setCarrito(p=>p.map(i=>i.id===id?{...i,descuento:Math.min(100,Math.max(0,pct))}:i));
  const totalCarrito=carrito.reduce((s,i)=>s+(i.precio*(1-i.descuento/100))*i.cantidad,0);

  // ── PROCESAR VENTA ──
  const procesarVenta=(metodoPago,montoRecibido,esDelivery=false,esConsignacion=false,clienteId=null)=>{
    if(!carrito.length){notificar("Carrito vacío","error");return null;}
    const ivaT=carrito.reduce((s,i)=>{const p=i.precio*(1-i.descuento/100)*i.cantidad;return s+ivaInc(p).iva;},0);
    const venta={
      id:genId(),fecha:hoy(),items:[...carrito],total:totalCarrito,iva:ivaT,base:totalCarrito-ivaT,
      metodoPago,montoRecibido:montoRecibido||totalCarrito,
      cambio:Math.max(0,(montoRecibido||totalCarrito)-totalCarrito),
      cliente:{...clienteAct},clienteId,tipo:esDelivery?"delivery":esConsignacion?"consignacion":clienteAct.tipo,
      estado:esDelivery?"pendiente":esConsignacion?"pendiente_cobro":"completada",usuario:usuarioActual,
    };
    setVentas(p=>[venta,...p]);
    setProductos(p=>p.map(pr=>{const it=carrito.find(i=>i.id===pr.id);return it?{...pr,stock:pr.stock-it.cantidad}:pr;}));
    if(!esConsignacion) setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"ingreso",monto:totalCarrito,desc:`Venta #${venta.id.slice(-6).toUpperCase()}`,fecha:venta.fecha,cat:"venta",usuario:usuarioActual}]}));
    if(esDelivery) setPedidosD(p=>[{...venta,estado:"pendiente"},...p]);
    if(esConsignacion) setConsignaciones(p=>[venta,...p]);
    if(clienteId) setClientes(p=>p.map(c=>c.id===clienteId?{...c,compras:[...c.compras,venta.id]}:c));
    setCarrito([]);setClienteAct({nombre:"",telefono:"",direccion:"",tipo:"mostrador",id:null});
    notificar(esConsignacion?`Consignación registrada ${fmtGs(totalCarrito)}`:`Venta ${fmtGs(totalCarrito)} — IVA ${fmtGs(ivaT)}`);
    return venta;
  };

  // ── REGISTRAR COMPRA ──
  const registrarCompra=(compra)=>{
    const nuevaCompra={...compra,id:genId(),fecha:hoy(),usuario:usuarioActual};
    setCompras(p=>[nuevaCompra,...p]);
    // actualizar stock y historial PPP
    setProductos(p=>p.map(pr=>{
      const it=compra.items.find(i=>i.id===pr.id);
      if(!it) return pr;
      const nuevoHist=[...pr.historialCompras,{precioUnitario:it.precioUnitario,cantidad:it.cantidad,fecha:nuevaCompra.fecha}];
      const ppp=calcPPP(nuevoHist);
      return {...pr,stock:pr.stock+it.cantidad,costo:Math.round(ppp),historialCompras:nuevoHist};
    }));
    // deuda o pago al proveedor
    if(compra.proveedorId){
      setProveedores(p=>p.map(pr=>{
        if(pr.id!==compra.proveedorId) return pr;
        const deuda=compra.pagado?0:compra.total;
        const pagoImm=compra.pagado?[{monto:compra.total,concepto:"Pago inmediato",fecha:hoy()}]:[];
        return {...pr,saldo:pr.saldo+deuda,compras:[...pr.compras,nuevaCompra.id],pagos:[...pr.pagos,...pagoImm]};
      }));
    }
    if(compra.pagado) setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:compra.total,desc:`Compra #${nuevaCompra.id.slice(-6).toUpperCase()} — ${compra.proveedorNombre}`,fecha:hoy(),cat:"compra",usuario:usuarioActual}]}));
    notificar(`Compra registrada. PPP actualizado`);
    return nuevaCompra;
  };

  const saldoCaja=caja.saldoInicial+caja.movimientos.reduce((s,m)=>m.tipo==="ingreso"?s+m.monto:s-m.monto,0);
  const ventasHoy=ventas.filter(v=>new Date(v.fecha).toDateString()===new Date().toDateString());
  const totalHoy=ventasHoy.reduce((s,v)=>s+v.total,0);
  const pctMeta=Math.min(100,Math.round((totalHoy/metas.diaria)*100));

  const VISTAS=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"pos",      icon:"🛒",label:"Venta"},
    {id:"delivery", icon:"🛵",label:"Delivery"},
    {id:"compras",  icon:"🛍️", label:"Compras"},
    {id:"consignacion",icon:"📋",label:"Consignación"},
    {id:"caja",     icon:"💰",label:"Caja"},
    {id:"clientes", icon:"👥",label:"Clientes"},
    {id:"promos",   icon:"📣",label:"Promos WA"},
    {id:"proveedores",icon:"🏭",label:"Proveedores"},
    {id:"rrhh",     icon:"👔",label:"Personal"},
    {id:"gastos",   icon:"💸",label:"Gastos"},
    {id:"catalogo", icon:"📦",label:"Catálogo"},
    {id:"ppp",      icon:"⚖️", label:"Precio Medio"},
    {id:"metas",    icon:"🎯",label:"Metas"},
    {id:"ventas",   icon:"🧾",label:"Ventas"},
    {id:"finanzas", icon:"📈",label:"Finanzas"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#080b14",color:"#e8eaf0",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      {/* HEADER */}
      <header style={{background:"#0f1623",borderBottom:"1px solid #1e2840",padding:"0 1rem",display:"flex",alignItems:"center",gap:"0.75rem",height:52,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🥤</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,letterSpacing:"0.02em"}}>BEBIDAS EXPRESS</div>
            <div style={{fontSize:9,color:"#6b7280",letterSpacing:"0.06em"}}>SISTEMA DE GESTIÓN v3</div>
          </div>
        </div>
        <nav style={{display:"flex",gap:1,flex:1,flexWrap:"wrap",marginLeft:6,overflow:"hidden"}}>
          {VISTAS.map(v=>(
            <button key={v.id} onClick={()=>setVista(v.id)} style={{padding:"4px 8px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,background:vista===v.id?"#4f46e5":"transparent",color:vista===v.id?"#fff":"#9ca3af",whiteSpace:"nowrap",flexShrink:0}}>
              {v.icon} {v.label}
            </button>
          ))}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {alertas.length>0&&<div style={{position:"relative",cursor:"pointer"}} onClick={()=>setVista("catalogo")}>
            <span style={{fontSize:16}}>🔔</span>
            <span style={{position:"absolute",top:-4,right:-6,background:"#ef4444",color:"#fff",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{alertas.length}</span>
          </div>}
          <div style={{fontSize:10,color:"#6b7280"}}>{usuarioActual}</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:"#6b7280"}}>Caja</div>
            <div style={{fontSize:12,fontWeight:700,color:caja.abierta?"#22c55e":"#ef4444"}}>{caja.abierta?fmtGs(saldoCaja):"CERRADA"}</div>
          </div>
          <div style={{width:8,height:8,borderRadius:"50%",background:caja.abierta?"#22c55e":"#ef4444"}}/>
        </div>
      </header>

      {notif&&<div style={{position:"fixed",top:60,right:14,zIndex:9999,padding:"10px 16px",borderRadius:9,background:notif.tipo==="success"?"#166534":"#7f1d1d",color:"#fff",fontWeight:600,fontSize:12,boxShadow:"0 8px 24px rgba(0,0,0,.5)",animation:"si .2s ease"}}>{notif.tipo==="success"?"✓ ":"✗ "}{notif.msg}</div>}

      <main style={{flex:1,overflow:"auto",minHeight:0}}>
        {vista==="dashboard"  && <VistaDashboard ventas={ventas} compras={compras} productos={productos} metas={metas} totalHoy={totalHoy} pctMeta={pctMeta} alertas={alertas} caja={caja} saldoCaja={saldoCaja} consignaciones={consignaciones} setVista={setVista}/>}
        {vista==="pos"        && <VistaPOS productos={productos} carrito={carrito} addCarrito={addCarrito} cambiarQty={cambiarQty} quitarItem={quitarItem} aplicarDesc={aplicarDesc} totalCarrito={totalCarrito} procesarVenta={procesarVenta} clienteAct={clienteAct} setClienteAct={setClienteAct} cajaAbierta={caja.abierta} clientes={clientes}/>}
        {vista==="delivery"   && <VistaDelivery pedidos={pedidosD} setPedidos={setPedidosD} productos={productos} carrito={carrito} addCarrito={addCarrito} cambiarQty={cambiarQty} quitarItem={quitarItem} totalCarrito={totalCarrito} procesarVenta={procesarVenta} clienteAct={clienteAct} setClienteAct={setClienteAct} cajaAbierta={caja.abierta} notificar={notificar} clientes={clientes}/>}
        {vista==="compras"    && <VistaCompras productos={productos} proveedores={proveedores} registrarCompra={registrarCompra} compras={compras} notificar={notificar}/>}
        {vista==="consignacion"&&<VistaConsignacion consignaciones={consignaciones} setConsignaciones={setConsignaciones} setCaja={setCaja} clientes={clientes} carrito={carrito} addCarrito={addCarrito} cambiarQty={cambiarQty} quitarItem={quitarItem} totalCarrito={totalCarrito} procesarVenta={procesarVenta} clienteAct={clienteAct} setClienteAct={setClienteAct} cajaAbierta={caja.abierta} productos={productos} notificar={notificar}/>}
        {vista==="caja"       && <VistaCaja caja={caja} setCaja={setCaja} saldoCaja={saldoCaja} notificar={notificar} usuarioActual={usuarioActual} setUsuarioActual={setUsuarioActual} funcionarios={funcionarios}/>}
        {vista==="clientes"   && <VistaClientes clientes={clientes} setClientes={setClientes} ventas={ventas} notificar={notificar}/>}
        {vista==="promos"     && <VistaPromos clientes={clientes} productos={productos} promos={promos} setPromos={setPromos} notificar={notificar}/>}
        {vista==="proveedores"&& <VistaProveedores proveedores={proveedores} setProveedores={setProveedores} setCaja={setCaja} notificar={notificar}/>}
        {vista==="rrhh"       && <VistaRRHH funcionarios={funcionarios} setFuncionarios={setFuncionarios} setCaja={setCaja} notificar={notificar}/>}
        {vista==="gastos"     && <VistaGastos gastosFijos={gastosFijos} setGastosFijos={setGastosFijos} gastosVar={gastosVar} setGastosVar={setGastosVar} setCaja={setCaja} notificar={notificar}/>}
        {vista==="catalogo"   && <VistaCatalogo productos={productos} setProductos={setProductos} notificar={notificar} alertas={alertas}/>}
        {vista==="ppp"        && <VistaPPP productos={productos} setProductos={setProductos} promos={promos} setPromos={setPromos} notificar={notificar}/>}
        {vista==="metas"      && <VistaMetas metas={metas} setMetas={setMetas} ventas={ventas} totalHoy={totalHoy} pctMeta={pctMeta}/>}
        {vista==="ventas"     && <VistaVentas ventas={ventas} devoluciones={devoluciones} setDevoluciones={setDevoluciones} setVentas={setVentas} setProductos={setProductos} setCaja={setCaja} notificar={notificar}/>}
        {vista==="finanzas"   && <VistaFinanzas ventas={ventas} compras={compras} devoluciones={devoluciones} productos={productos} caja={caja} saldoCaja={saldoCaja} gastosFijos={gastosFijos} gastosVar={gastosVar} funcionarios={funcionarios} consignaciones={consignaciones}/>}
      </main>
      <style>{`@keyframes si{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function VistaDashboard({ventas,compras,productos,metas,totalHoy,pctMeta,alertas,caja,saldoCaja,consignaciones,setVista}) {
  const ventasHoy=ventas.filter(v=>new Date(v.fecha).toDateString()===new Date().toDateString());
  const ventasAyer=ventas.filter(v=>{const a=new Date();a.setDate(a.getDate()-1);return new Date(v.fecha).toDateString()===a.toDateString();});
  const totalAyer=ventasAyer.reduce((s,v)=>s+v.total,0);
  const diff=totalAyer>0?((totalHoy-totalAyer)/totalAyer*100).toFixed(0):0;
  const ivaHoy=ventasHoy.reduce((s,v)=>s+(v.iva||0),0);
  const consignPend=consignaciones.filter(c=>c.estado==="pendiente_cobro");
  const totalConsignP=consignPend.reduce((s,c)=>s+c.total,0);
  const stockBajo=productos.filter(p=>p.disponible&&p.stock<=p.stockMin);

  // ventas por hora hoy
  const porHora=Array(24).fill(0);
  ventasHoy.forEach(v=>{const h=new Date(v.fecha).getHours();porHora[h]+=v.total;});
  const horasPico=porHora.map((v,h)=>({h,v})).filter(x=>x.v>0);
  const maxH=Math.max(...porHora.filter(x=>x>0),1);

  return(
    <div style={{padding:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:700,margin:0}}>📊 Dashboard</h2>
          <div style={{fontSize:11,color:"#6b7280"}}>{new Date().toLocaleDateString("es-PY",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{fontSize:11,color:"#6b7280",background:"#111827",padding:"5px 12px",borderRadius:20,border:"1px solid #1e2840"}}>👤 {caja.abierta?`Caja abierta`:"Caja cerrada"}</div>
      </div>

      {/* KPI ROW */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
        {[
          {l:"Ventas Hoy",v:fmtGs(totalHoy),sub:`${ventasHoy.length} transacciones`,c:"#818cf8",ic:"🛒"},
          {l:"vs Ayer",v:`${diff>0?"+":""}${diff}%`,sub:fmtGs(totalAyer)+" ayer",c:Number(diff)>=0?"#22c55e":"#ef4444",ic:Number(diff)>=0?"📈":"📉"},
          {l:"IVA Hoy",v:fmtGs(ivaHoy),sub:"a recaudar",c:"#f59e0b",ic:"🧾"},
          {l:"Saldo Caja",v:caja.abierta?fmtGs(saldoCaja):"—",sub:caja.abierta?"abierta":"cerrada",c:caja.abierta?"#22c55e":"#ef4444",ic:"💰"},
          {l:"Consignaciones",v:fmtGs(totalConsignP),sub:`${consignPend.length} pendientes`,c:"#f59e0b",ic:"📋"},
        ].map(({l,v,sub,c,ic})=>(
          <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:"13px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontSize:10,color:"#6b7280"}}>{l}</div>
              <div style={{fontSize:16}}>{ic}</div>
            </div>
            <div style={{fontSize:17,fontWeight:700,color:c,marginBottom:2}}>{v}</div>
            <div style={{fontSize:10,color:"#6b7280"}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* META DEL DÍA */}
      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:600,fontSize:13}}>🎯 Meta Diaria</div>
          <div style={{fontSize:12,fontWeight:700,color:pctMeta>=100?"#22c55e":"#818cf8"}}>{pctMeta}% — {fmtGs(totalHoy)} / {fmtGs(metas.diaria)}</div>
        </div>
        <div style={{width:"100%",height:12,background:"#1e2840",borderRadius:6,overflow:"hidden"}}>
          <div style={{width:`${pctMeta}%`,height:"100%",background:pctMeta>=100?"linear-gradient(90deg,#16a34a,#22c55e)":"linear-gradient(90deg,#4f46e5,#818cf8)",borderRadius:6,transition:"width .5s ease"}}/>
        </div>
        {pctMeta>=100&&<div style={{fontSize:11,color:"#22c55e",marginTop:5}}>🎉 ¡Meta superada! Excelente trabajo.</div>}
        {pctMeta<100&&<div style={{fontSize:11,color:"#6b7280",marginTop:5}}>Faltan {fmtGs(metas.diaria-totalHoy)} para alcanzar la meta</div>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        {/* GRÁFICO VENTAS POR HORA */}
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>⏰ Ventas por Hora (hoy)</div>
          {horasPico.length===0?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",paddingTop:20}}>Sin ventas hoy</div>:(
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
              {porHora.map((v,h)=>(
                <div key={h} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:"100%",background:v>0?"#4f46e5":"#1e2840",borderRadius:"3px 3px 0 0",height:`${(v/maxH)*70}px`,minHeight:v>0?4:0,transition:"height .3s"}}/>
                  {v>0&&<div style={{fontSize:8,color:"#6b7280",marginTop:2}}>{h}h</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ALERTAS */}
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>🔔 Alertas Activas ({alertas.length})</div>
          {alertas.length===0?<div style={{color:"#22c55e",fontSize:12}}>✓ Sin alertas pendientes</div>:
            <div style={{maxHeight:120,overflow:"auto"}}>
              {alertas.map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #1e2840",fontSize:12}}>
                  <span style={{fontSize:14}}>⚠</span>
                  <div style={{flex:1}}>
                    <div style={{color:"#fbbf24"}}>{a.msg}</div>
                  </div>
                  <button onClick={()=>setVista("catalogo")} style={{fontSize:10,padding:"2px 7px",borderRadius:5,border:"none",background:"#1e2840",color:"#9ca3af",cursor:"pointer"}}>Ver</button>
                </div>
              ))}
            </div>
          }
          {stockBajo.length>0&&<div style={{marginTop:8,fontSize:11,color:"#6b7280"}}>Ir a Catálogo → Editar stock mínimo</div>}
        </div>
      </div>

      {/* TOP PRODUCTOS HOY */}
      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>🏆 Más vendidos hoy</div>
        {ventasHoy.length===0?<div style={{color:"#6b7280",fontSize:12}}>Sin ventas hoy</div>:(()=>{
          const map={};
          ventasHoy.forEach(v=>v.items.forEach(i=>{if(!map[i.nombre])map[i.nombre]={cant:0,total:0,img:i.imagen};map[i.nombre].cant+=i.cantidad;map[i.nombre].total+=i.precio*i.cantidad;}));
          return Object.entries(map).sort((a,b)=>b[1].cant-a[1].cant).slice(0,5).map(([n,d],idx)=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:10,padding:"5px 0",borderBottom:"1px solid #1e2840"}}>
              <span style={{fontSize:10,color:"#6b7280",minWidth:16}}>#{idx+1}</span>
              <span style={{fontSize:16}}>{d.img}</span>
              <div style={{flex:1,fontSize:12,fontWeight:500}}>{n}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#818cf8"}}>{d.cant} u. · {fmtGs(d.total)}</div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  POS
// ══════════════════════════════════════════════════════════════
function VistaPOS({productos,carrito,addCarrito,cambiarQty,quitarItem,aplicarDesc,totalCarrito,procesarVenta,clienteAct,setClienteAct,cajaAbierta,clientes}) {
  const [filtRub,setFiltRub]=useState("Todos");
  const [buscar,setBuscar]=useState("");
  const [showPago,setShowPago]=useState(false);
  const [metodo,setMetodo]=useState("efectivo");
  const [montoRec,setMontoRec]=useState("");
  const [ultimaVenta,setUltimaVenta]=useState(null);
  const [showClientes,setShowClientes]=useState(false);
  const [descGlobal,setDescGlobal]=useState("");

  const rubros=["Todos",...[...new Set(productos.map(p=>p.rubro))]];
  const prods=productos.filter(p=>p.disponible&&(filtRub==="Todos"||p.rubro===filtRub)&&p.nombre.toLowerCase().includes(buscar.toLowerCase()));
  const ivaT=carrito.reduce((s,i)=>{const p=i.precio*(1-i.descuento/100)*i.cantidad;return s+ivaInc(p).iva;},0);

  const confirmar=()=>{
    const v=procesarVenta(metodo,parseFloat(montoRec)||totalCarrito,false,false,clienteAct.id||null);
    if(v){setUltimaVenta(v);setShowPago(false);setMontoRec("");}
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 350px",height:"calc(100vh - 52px)"}}>
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"8px 12px",background:"#0f1623",borderBottom:"1px solid #1e2840",display:"flex",gap:7}}>
          <input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar producto..." style={{...IS,flex:1}}/>
        </div>
        <div style={{padding:"6px 12px",display:"flex",gap:4,flexWrap:"wrap",background:"#0f1623",borderBottom:"1px solid #1e2840"}}>
          {rubros.map(r=><button key={r} onClick={()=>setFiltRub(r)} style={{padding:"3px 9px",borderRadius:20,border:"1px solid",borderColor:filtRub===r?"#4f46e5":"#1e2840",background:filtRub===r?"#4f46e5":"transparent",color:filtRub===r?"#fff":"#9ca3af",fontSize:10,cursor:"pointer"}}>{r}</button>)}
        </div>
        <div style={{flex:1,overflow:"auto",padding:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,alignContent:"start"}}>
          {prods.map(p=>{
            const ppp=calcPPP(p.historialCompras);
            const margenPPP=ppp>0?((p.precio-ppp)/ppp*100).toFixed(0):null;
            return(
              <div key={p.id} onClick={()=>addCarrito(p)} style={{background:"#0f1623",border:"1px solid #1e2840",borderRadius:10,padding:11,cursor:"pointer",opacity:p.stock<=0?.5:1,transition:"border-color .12s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#4f46e5"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2840"}>
                <div style={{fontSize:26,marginBottom:5}}>{p.imagen}</div>
                <div style={{fontSize:11,fontWeight:600,marginBottom:2,lineHeight:1.3}}>{p.nombre}</div>
                <div style={{fontSize:9,color:"#6b7280",marginBottom:4}}>{p.rubro}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#818cf8"}}>{fmtGs(p.precio)}</div>
                {margenPPP&&<div style={{fontSize:9,color:Number(margenPPP)>30?"#22c55e":"#f59e0b",marginTop:2}}>PPP: {margenPPP}% margen</div>}
                <div style={{fontSize:9,color:p.stock<=p.stockMin?"#f59e0b":"#6b7280",marginTop:2}}>Stock: {p.stock}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARRITO */}
      <div style={{background:"#0f1623",borderLeft:"1px solid #1e2840",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid #1e2840"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:7}}>🛒 Carrito</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:5,marginBottom:5}}>
            <input value={clienteAct.nombre} onChange={e=>setClienteAct(p=>({...p,nombre:e.target.value}))} placeholder="Cliente" style={IS}/>
            <button onClick={()=>setShowClientes(true)} style={{...IS,padding:"0 9px",cursor:"pointer",fontSize:16}}>👥</button>
          </div>
          <select value={clienteAct.tipo} onChange={e=>setClienteAct(p=>({...p,tipo:e.target.value}))} style={{...IS,width:"100%"}}>
            <option value="mostrador">Mostrador</option><option value="llevar">Para llevar</option>
          </select>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"5px 10px"}}>
          {carrito.length===0?<div style={{textAlign:"center",color:"#6b7280",marginTop:28,fontSize:12}}>🛒 Seleccioná productos</div>
            :carrito.map(it=>(
              <div key={it.id} style={{padding:"7px 0",borderBottom:"1px solid #1e2840"}}>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:16}}>{it.imagen}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.nombre}</div>
                    <div style={{fontSize:10,color:"#818cf8"}}>{fmtGs(it.precio*(1-it.descuento/100)*it.cantidad)}</div>
                  </div>
                  <div style={{display:"flex",gap:2}}>
                    <button onClick={()=>cambiarQty(it.id,-1)} style={BS}>−</button>
                    <span style={{fontSize:11,fontWeight:700,minWidth:16,textAlign:"center"}}>{it.cantidad}</span>
                    <button onClick={()=>cambiarQty(it.id,1)} style={BS}>+</button>
                    <button onClick={()=>quitarItem(it.id)} style={{...BS,background:"#7f1d1d",color:"#fca5a5"}}>✕</button>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                  <span style={{fontSize:9,color:"#6b7280"}}>% desc:</span>
                  <input type="number" value={it.descuento} onChange={e=>aplicarDesc(it.id,parseFloat(e.target.value)||0)} style={{...IS,width:50,padding:"2px 5px",fontSize:11}} min="0" max="100"/>
                  {it.descuento>0&&<span style={{fontSize:9,color:"#22c55e"}}>−{fmtGs(it.precio*it.descuento/100*it.cantidad)}</span>}
                </div>
              </div>
            ))
          }
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid #1e2840"}}>
          <div style={{fontSize:10,color:"#6b7280",marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><span>Base imponible</span><span>{fmtGs(totalCarrito-ivaT)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#f59e0b"}}><span>IVA 10%</span><span>{fmtGs(ivaT)}</span></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,marginBottom:10}}><span>TOTAL</span><span style={{color:"#818cf8"}}>{fmtGs(totalCarrito)}</span></div>
          <button onClick={()=>{if(cajaAbierta&&carrito.length)setShowPago(true);}} disabled={!cajaAbierta||!carrito.length}
            style={{width:"100%",padding:10,borderRadius:8,border:"none",background:cajaAbierta&&carrito.length?"linear-gradient(135deg,#4f46e5,#7c3aed)":"#374151",color:"#fff",fontWeight:700,fontSize:13,cursor:cajaAbierta&&carrito.length?"pointer":"not-allowed"}}>
            💳 COBRAR {fmtGs(totalCarrito)}
          </button>
          {!cajaAbierta&&<div style={{textAlign:"center",fontSize:10,color:"#f59e0b",marginTop:4}}>⚠ Abra la caja primero</div>}
        </div>
      </div>

      {showClientes&&<Modal onClose={()=>setShowClientes(false)} titulo="👥 Seleccionar Cliente">
        {clientes.map(c=><div key={c.id} onClick={()=>{setClienteAct(p=>({...p,nombre:c.nombre,telefono:c.telefono,direccion:c.direccion,id:c.id}));setShowClientes(false);}} style={{padding:"9px 12px",borderRadius:8,border:"1px solid #1e2840",marginBottom:7,cursor:"pointer",background:"#0d1117"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#4f46e5"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2840"}>
          <div style={{fontWeight:600,fontSize:12}}>{c.nombre}</div>
          <div style={{fontSize:10,color:"#6b7280"}}>{c.telefono} · {c.tipoCliente}</div>
        </div>)}
      </Modal>}

      {showPago&&<Modal onClose={()=>setShowPago(false)} titulo="💳 Procesar Pago">
        <div style={{marginBottom:10}}>
          <div style={LBL}>Método de pago</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[["efectivo","💵 Efectivo"],["tarjeta","💳 Tarjeta"],["transferencia","📲 Transf."],["credito","📒 Crédito"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMetodo(v)} style={{padding:"6px 11px",borderRadius:7,border:"2px solid",borderColor:metodo===v?"#4f46e5":"#1e2840",background:metodo===v?"#4f46e5":"transparent",color:"#fff",cursor:"pointer",fontSize:11}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{background:"#0d1117",borderRadius:8,padding:11,marginBottom:10,fontSize:12}}>
          {carrito.map(i=><div key={i.id} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span>{i.nombre} x{i.cantidad}{i.descuento>0?` (−${i.descuento}%)`:"" }</span><span>{fmtGs(i.precio*(1-i.descuento/100)*i.cantidad)}</span></div>)}
          <div style={{borderTop:"1px dashed #1e2840",marginTop:6,paddingTop:6}}>
            <div style={{display:"flex",justifyContent:"space-between",color:"#9ca3af"}}><span>Base</span><span>{fmtGs(totalCarrito-ivaT)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#f59e0b"}}><span>IVA 10%</span><span>{fmtGs(ivaT)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14,marginTop:4}}><span>TOTAL</span><span style={{color:"#818cf8"}}>{fmtGs(totalCarrito)}</span></div>
          </div>
        </div>
        {metodo==="efectivo"&&<div style={{marginBottom:10}}>
          <div style={LBL}>Monto recibido</div>
          <input type="number" value={montoRec} onChange={e=>setMontoRec(e.target.value)} style={{...IS,width:"100%",fontSize:16,fontWeight:700}}/>
          {montoRec&&parseFloat(montoRec)>=totalCarrito&&<div style={{marginTop:6,padding:"7px 11px",background:"#166534",borderRadius:7,fontSize:12,fontWeight:600}}>Cambio: {fmtGs(parseFloat(montoRec)-totalCarrito)}</div>}
        </div>}
        <button onClick={confirmar} style={{width:"100%",padding:10,borderRadius:8,border:"none",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>✓ CONFIRMAR VENTA</button>
      </Modal>}
      {ultimaVenta&&<TicketModal venta={ultimaVenta} onClose={()=>setUltimaVenta(null)}/>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  COMPRAS (vinculada a Proveedores + PPP)
// ══════════════════════════════════════════════════════════════
function VistaCompras({productos,proveedores,registrarCompra,compras,notificar}) {
  const [items,setItems]=useState([]);
  const [provId,setProvId]=useState("");
  const [pagado,setPagado]=useState(true);
  const [nroFactura,setNroFactura]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [addProd,setAddProd]=useState("");
  const [addQty,setAddQty]=useState(1);
  const [addPrecio,setAddPrecio]=useState("");

  const prov=proveedores.find(p=>p.id===provId);
  const totalCompra=items.reduce((s,i)=>s+i.precioUnitario*i.cantidad,0);

  const agregarItem=()=>{
    const prod=productos.find(p=>p.id===parseInt(addProd));
    if(!prod||!addPrecio||addQty<1){notificar("Completá los datos del ítem","error");return;}
    setItems(p=>[...p,{...prod,precioUnitario:parseFloat(addPrecio),cantidad:parseInt(addQty)}]);
    setAddProd("");setAddQty(1);setAddPrecio("");setShowAdd(false);
  };
  const confirmar=()=>{
    if(!provId||!items.length){notificar("Elegí proveedor y agregá ítems","error");return;}
    registrarCompra({items,proveedorId:provId,proveedorNombre:prov?.nombre||"",total:totalCompra,pagado,nroFactura});
    setItems([]);setNroFactura("");setPagado(true);
  };

  return(
    <div style={{padding:20,display:"grid",gridTemplateColumns:"1fr 340px",gap:16,maxWidth:1100,margin:"0 auto"}}>
      <div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>🛍️ Registrar Compra</h2>
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15,marginBottom:14}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>Datos de la Compra</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
            <div><div style={LBL}>Proveedor *</div>
              <select value={provId} onChange={e=>setProvId(e.target.value)} style={{...IS,width:"100%"}}>
                <option value="">— Seleccionar —</option>
                {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div><div style={LBL}>N° Factura</div><input value={nroFactura} onChange={e=>setNroFactura(e.target.value)} placeholder="001-001-0001234" style={{...IS,width:"100%"}}/></div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <div style={{fontWeight:600,fontSize:12}}>Forma de pago:</div>
            {[["true","💵 Pago inmediato"],["false","📒 Fiado (deuda)"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPagado(v==="true")} style={{padding:"5px 12px",borderRadius:7,border:"2px solid",borderColor:String(pagado)===v?"#4f46e5":"#1e2840",background:String(pagado)===v?"#4f46e5":"transparent",color:"#fff",cursor:"pointer",fontSize:11}}>{l}</button>
            ))}
          </div>
          {!pagado&&<div style={{marginTop:7,padding:"7px 11px",background:"#451a0330",border:"1px solid #92400e",borderRadius:7,fontSize:11,color:"#fbbf24"}}>⚠ Se generará deuda de {fmtGs(totalCompra)} con {prov?.nombre||"el proveedor"}</div>}
        </div>

        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:600,fontSize:13}}>📦 Ítems a comprar</div>
            <button onClick={()=>setShowAdd(true)} style={{...BTNP,fontSize:11,padding:"5px 12px"}}>+ Agregar ítem</button>
          </div>
          {items.length===0?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",padding:20}}>Agregá los productos a comprar</div>:
            items.map((it,i)=>{
              const ppp=calcPPP(productos.find(p=>p.id===it.id)?.historialCompras||[]);
              const diffPPP=ppp>0?((it.precioUnitario-ppp)/ppp*100).toFixed(0):null;
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #1e2840"}}>
                  <span style={{fontSize:20}}>{it.imagen}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600}}>{it.nombre}</div>
                    <div style={{fontSize:10,color:"#9ca3af"}}>{it.cantidad} u. × {fmtGs(it.precioUnitario)} = {fmtGs(it.precioUnitario*it.cantidad)}</div>
                    {diffPPP&&<div style={{fontSize:9,color:Number(diffPPP)>0?"#f59e0b":"#22c55e"}}>{Number(diffPPP)>0?"↑ Más caro que PPP anterior":"↓ Más barato que PPP"} ({diffPPP}%)</div>}
                  </div>
                  <button onClick={()=>setItems(p=>p.filter((_,j)=>j!==i))} style={{...BS,background:"#7f1d1d",color:"#fca5a5"}}>✕</button>
                </div>
              );
            })
          }
          {items.length>0&&(
            <div style={{marginTop:10,padding:"10px 0",borderTop:"1px solid #1e2840"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,marginBottom:12}}><span>TOTAL COMPRA</span><span style={{color:"#818cf8"}}>{fmtGs(totalCompra)}</span></div>
              <button onClick={confirmar} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>✓ CONFIRMAR COMPRA</button>
            </div>
          )}
        </div>
      </div>

      {/* HISTORIAL */}
      <div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>📋 Historial de Compras</h2>
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14,maxHeight:"calc(100vh - 140px)",overflow:"auto"}}>
          {compras.length===0?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",marginTop:20}}>Sin compras registradas</div>:
            compras.map(c=>(
              <div key={c.id} style={{border:"1px solid #1e2840",borderRadius:8,padding:11,marginBottom:9}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:12}}>#{c.id.slice(-6).toUpperCase()}</span>
                    {c.nroFactura&&<span style={{fontSize:10,color:"#6b7280",marginLeft:6}}>Fac: {c.nroFactura}</span>}
                  </div>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:c.pagado?"#16603430":"#451a0330",color:c.pagado?"#22c55e":"#f59e0b"}}>{c.pagado?"Pagado":"Fiado"}</span>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:3}}>🏭 {c.proveedorNombre} · {fmtFec(c.fecha)}</div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:5}}>{c.items.map(i=>`${i.nombre} x${i.cantidad}`).join(", ")}</div>
                <div style={{fontWeight:700,color:"#818cf8",fontSize:13}}>{fmtGs(c.total)}</div>
              </div>
            ))
          }
        </div>
      </div>

      {showAdd&&<Modal onClose={()=>setShowAdd(false)} titulo="➕ Agregar ítem a compra">
        <div style={{marginBottom:9}}><div style={LBL}>Producto *</div>
          <select value={addProd} onChange={e=>setAddProd(e.target.value)} style={{...IS,width:"100%"}}>
            <option value="">— Seleccionar —</option>
            {productos.map(p=><option key={p.id} value={p.id}>{p.imagen} {p.nombre}</option>)}
          </select>
        </div>
        {addProd&&(()=>{const p=productos.find(x=>x.id===parseInt(addProd));const ppp=calcPPP(p?.historialCompras||[]);return ppp>0&&<div style={{marginBottom:9,padding:"7px 11px",background:"#1e2840",borderRadius:7,fontSize:11}}>📊 PPP actual: {fmtGs(ppp)} · Precio venta: {fmtGs(p.precio)}</div>;})()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:9}}>
          <div><div style={LBL}>Cantidad *</div><input type="number" value={addQty} onChange={e=>setAddQty(e.target.value)} min="1" style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Precio unitario (Gs.) *</div><input type="number" value={addPrecio} onChange={e=>setAddPrecio(e.target.value)} style={{...IS,width:"100%"}}/></div>
        </div>
        {addPrecio&&addQty&&<div style={{marginBottom:9,padding:"7px 11px",background:"#0d1117",borderRadius:7,fontSize:12}}>Subtotal: <strong>{fmtGs(parseFloat(addPrecio)*parseInt(addQty)||0)}</strong></div>}
        <button onClick={agregarItem} style={{...BTNP,width:"100%"}}>✓ Agregar</button>
      </Modal>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CONSIGNACIÓN
// ══════════════════════════════════════════════════════════════
function VistaConsignacion({consignaciones,setConsignaciones,setCaja,clientes,carrito,addCarrito,cambiarQty,quitarItem,totalCarrito,procesarVenta,clienteAct,setClienteAct,cajaAbierta,productos,notificar}) {
  const [tab,setTab]=useState("nueva");
  const [buscar,setBuscar]=useState("");
  const prods=productos.filter(p=>p.disponible&&p.nombre.toLowerCase().includes(buscar.toLowerCase()));
  const pend=consignaciones.filter(c=>c.estado==="pendiente_cobro");

  const cobrar=(c)=>{
    setConsignaciones(p=>p.map(x=>x.id===c.id?{...x,estado:"cobrada",fechaCobro:hoy()}:x));
    setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"ingreso",monto:c.total,desc:`Cobro consignación #${c.id.slice(-6).toUpperCase()}`,fecha:hoy(),cat:"consignacion"}]}));
    notificar(`Consignación cobrada: ${fmtGs(c.total)}`);
  };
  const devolver=(c)=>{
    setConsignaciones(p=>p.map(x=>x.id===c.id?{...x,estado:"devuelta"}:x));
    notificar("Consignación marcada como devuelta");
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 350px",height:"calc(100vh - 52px)"}}>
      <div style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"8px 12px",background:"#0f1623",borderBottom:"1px solid #1e2840",display:"flex",gap:7}}>
          {["nueva","pendientes","historial"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",background:tab===t?"#4f46e5":"#1e2840",color:"#fff",fontSize:11,fontWeight:600,textTransform:"capitalize"}}>{t==="nueva"?"📋 Nueva":t==="pendientes"?`⏳ Pendientes (${pend.length})`:"📂 Historial"}</button>)}
        </div>
        {tab==="nueva"&&(
          <>
            <div style={{padding:"6px 12px",background:"#0f1623",borderBottom:"1px solid #1e2840"}}>
              <input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar productos..." style={{...IS,width:"100%"}}/>
            </div>
            <div style={{flex:1,overflow:"auto",padding:12,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,alignContent:"start"}}>
              {prods.map(p=><div key={p.id} onClick={()=>addCarrito(p)} style={{background:"#0f1623",border:"1px solid #1e2840",borderRadius:10,padding:11,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#f59e0b"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2840"}>
                <div style={{fontSize:24}}>{p.imagen}</div>
                <div style={{fontSize:11,fontWeight:600,marginTop:5}}>{p.nombre}</div>
                <div style={{fontSize:12,color:"#818cf8",fontWeight:700,marginTop:3}}>{fmtGs(p.precio)}</div>
              </div>)}
            </div>
          </>
        )}
        {tab==="pendientes"&&(
          <div style={{flex:1,overflow:"auto",padding:14}}>
            {pend.length===0?<div style={{color:"#6b7280",textAlign:"center",marginTop:40,fontSize:13}}>Sin consignaciones pendientes</div>:
              pend.map(c=>(
                <div key={c.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:13,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontWeight:700,fontSize:13}}>#{c.id.slice(-6).toUpperCase()}</span>
                    <span style={{fontSize:11,padding:"2px 9px",borderRadius:20,background:"#f59e0b30",color:"#f59e0b",fontWeight:600}}>PENDIENTE COBRO</span>
                  </div>
                  <div style={{fontSize:12,marginBottom:3}}>👤 {c.cliente?.nombre||"Sin cliente"}</div>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:7}}>{fmtFec(c.fecha)}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>{c.items.map(i=>`${i.nombre} x${i.cantidad}`).join(", ")}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:700,color:"#818cf8",fontSize:14}}>{fmtGs(c.total)}</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>cobrar(c)} style={{padding:"5px 12px",borderRadius:7,border:"none",background:"#166534",color:"#22c55e",fontWeight:600,fontSize:11,cursor:"pointer"}}>💵 Cobrar</button>
                      <button onClick={()=>devolver(c)} style={{padding:"5px 12px",borderRadius:7,border:"none",background:"#7f1d1d",color:"#fca5a5",fontWeight:600,fontSize:11,cursor:"pointer"}}>↩ Devolver</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
        {tab==="historial"&&(
          <div style={{flex:1,overflow:"auto",padding:14}}>
            {consignaciones.filter(c=>c.estado!=="pendiente_cobro").map(c=>(
              <div key={c.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:9,padding:12,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontWeight:600,fontSize:12}}>#{c.id.slice(-6).toUpperCase()} — {c.cliente?.nombre||"—"}</span>
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:c.estado==="cobrada"?"#16603430":"#1e2840",color:c.estado==="cobrada"?"#22c55e":"#6b7280"}}>{c.estado}</span>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{fmtFec(c.fecha)} · {fmtGs(c.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL DERECHO */}
      <div style={{background:"#0f1623",borderLeft:"1px solid #1e2840",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"10px 12px",borderBottom:"1px solid #1e2840"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📋 Datos de Consignación</div>
          <input value={clienteAct.nombre} onChange={e=>setClienteAct(p=>({...p,nombre:e.target.value}))} placeholder="Nombre del cliente *" style={{...IS,width:"100%",marginBottom:5}}/>
          <input value={clienteAct.telefono} onChange={e=>setClienteAct(p=>({...p,telefono:e.target.value}))} placeholder="Teléfono" style={{...IS,width:"100%",marginBottom:5}}/>
          <input value={clienteAct.direccion} onChange={e=>setClienteAct(p=>({...p,direccion:e.target.value}))} placeholder="Dirección" style={{...IS,width:"100%"}}/>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"5px 10px"}}>
          {carrito.length===0?<div style={{color:"#6b7280",textAlign:"center",marginTop:28,fontSize:12}}>Agregá productos</div>:
            carrito.map(it=>(
              <div key={it.id} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 0",borderBottom:"1px solid #1e2840"}}>
                <span style={{fontSize:16}}>{it.imagen}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600}}>{it.nombre}</div>
                  <div style={{fontSize:10,color:"#818cf8"}}>{fmtGs(it.precio*it.cantidad)}</div>
                </div>
                <div style={{display:"flex",gap:2}}>
                  <button onClick={()=>cambiarQty(it.id,-1)} style={BS}>−</button>
                  <span style={{fontSize:11,fontWeight:700,minWidth:16,textAlign:"center"}}>{it.cantidad}</span>
                  <button onClick={()=>cambiarQty(it.id,1)} style={BS}>+</button>
                  <button onClick={()=>quitarItem(it.id)} style={{...BS,background:"#7f1d1d",color:"#fca5a5"}}>✕</button>
                </div>
              </div>
            ))
          }
        </div>
        <div style={{padding:"10px 12px",borderTop:"1px solid #1e2840"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15,marginBottom:10}}><span>TOTAL</span><span style={{color:"#f59e0b"}}>{fmtGs(totalCarrito)}</span></div>
          <button onClick={()=>{if(!clienteAct.nombre){notificar("Ingresá el nombre del cliente","error");return;}procesarVenta("consignacion",null,false,true);}} disabled={!cajaAbierta||!carrito.length}
            style={{width:"100%",padding:10,borderRadius:8,border:"none",background:cajaAbierta&&carrito.length?"linear-gradient(135deg,#d97706,#b45309)":"#374151",color:"#fff",fontWeight:700,fontSize:12,cursor:cajaAbierta&&carrito.length?"pointer":"not-allowed"}}>
            📋 DEJAR EN CONSIGNACIÓN
          </button>
          <div style={{fontSize:10,color:"#6b7280",textAlign:"center",marginTop:4}}>No egresa de caja hasta que se cobre</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PROMOS WHATSAPP
// ══════════════════════════════════════════════════════════════
function VistaPromos({clientes,productos,promos,setPromos,notificar}) {
  const [tab,setTab]=useState("crear");
  const [plantilla,setPlantilla]=useState("🎉 Hola {nombre}! Tenemos una promo especial:\n\n🥤 {producto} a solo {precio}!\n\nOferta válida hasta hoy. ¡No te la pierdas!\n\n📍 Bebidas Express");
  const [prodSelec,setProdSelec]=useState("");
  const [descPromo,setDescPromo]=useState(0);
  const [clientesFiltro,setClientesFiltro]=useState("todos");
  const [seleccionados,setSeleccionados]=useState([]);
  const [tituloPromo,setTituloPromo]=useState("");

  const prod=productos.find(p=>p.id===parseInt(prodSelec));
  const precioPromo=prod?Math.round(prod.precio*(1-descPromo/100)):0;

  const clisFiltrados=clientes.filter(c=>{
    if(clientesFiltro==="todos") return true;
    if(clientesFiltro==="mayoristas") return c.tipoCliente==="mayorista";
    if(clientesFiltro==="minoristas") return c.tipoCliente==="minorista";
    return true;
  });

  const toggleSelec=(id)=>setSeleccionados(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const selecTodos=()=>setSeleccionados(clisFiltrados.map(c=>c.id));
  const deselecTodos=()=>setSeleccionados([]);

  const generarMensaje=(cliente)=>{
    if(!prod){notificar("Seleccioná un producto","error");return "";}
    return plantilla.replace("{nombre}",cliente.nombre||"Cliente").replace("{producto}",prod.nombre).replace("{precio}",fmtGs(precioPromo)).replace("{descuento}",`${descPromo}%`);
  };

  const enviarWA=(cliente)=>{
    const msg=generarMensaje(cliente);
    if(!msg) return;
    const tel=cliente.telefono.replace(/\D/g,"");
    const url=`https://wa.me/595${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url,"_blank");
  };

  const guardarPromo=()=>{
    if(!tituloPromo||!prodSelec){notificar("Completá título y producto","error");return;}
    setPromos(p=>[{id:genId(),titulo:tituloPromo,producto:prod?.nombre,descuento:descPromo,precioPromo,plantilla,fecha:hoy(),enviados:0},...p]);
    notificar("Promoción guardada");
  };

  return(
    <div style={{padding:20}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>📣 Promos vía WhatsApp</h2>
      <div style={{display:"flex",gap:7,marginBottom:16}}>
        {["crear","enviar","historial"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",background:tab===t?"#25d366":"#1e2840",color:"#fff",fontSize:12,fontWeight:600}}>{t==="crear"?"✏ Crear Promo":t==="enviar"?"📤 Enviar a Clientes":"📋 Historial"}</button>)}
      </div>

      {tab==="crear"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Configurar Promoción</div>
            <div style={{marginBottom:9}}><div style={LBL}>Título de la promo</div><input value={tituloPromo} onChange={e=>setTituloPromo(e.target.value)} placeholder="Ej: Promo verano, Oferta semana..." style={{...IS,width:"100%"}}/></div>
            <div style={{marginBottom:9}}><div style={LBL}>Producto</div>
              <select value={prodSelec} onChange={e=>setProdSelec(e.target.value)} style={{...IS,width:"100%"}}>
                <option value="">— Seleccionar —</option>
                {productos.filter(p=>p.disponible).map(p=><option key={p.id} value={p.id}>{p.imagen} {p.nombre} — {fmtGs(p.precio)}</option>)}
              </select>
            </div>
            {prod&&<div style={{marginBottom:9}}>
              <div style={LBL}>Descuento: {descPromo}%</div>
              <input type="range" min="0" max="50" value={descPromo} onChange={e=>setDescPromo(Number(e.target.value))} style={{width:"100%"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:3}}>
                <span style={{color:"#9ca3af"}}>Precio normal: {fmtGs(prod.precio)}</span>
                <span style={{color:"#22c55e",fontWeight:700}}>Promo: {fmtGs(precioPromo)}</span>
              </div>
              {prod&&<div style={{marginTop:5,fontSize:10,color:"#6b7280"}}>PPP: {fmtGs(calcPPP(prod.historialCompras))} · Margen con promo: {prod.costo>0?((precioPromo-prod.costo)/prod.costo*100).toFixed(0):"—"}%</div>}
            </div>}
            <div style={{marginBottom:9}}><div style={LBL}>Mensaje (usar {"{nombre}"}, {"{producto}"}, {"{precio}"}, {"{descuento}"})</div>
              <textarea value={plantilla} onChange={e=>setPlantilla(e.target.value)} rows={6} style={{...IS,width:"100%",resize:"vertical",lineHeight:1.5}}/>
            </div>
            <button onClick={guardarPromo} style={{...BTNP,width:"100%",background:"linear-gradient(135deg,#25d366,#128c7e)"}}>💾 Guardar Promo</button>
          </div>
          <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>👁 Vista previa del mensaje</div>
            <div style={{background:"#0d1117",borderRadius:10,padding:14,fontSize:12,lineHeight:1.8,color:"#e8eaf0",whiteSpace:"pre-wrap",borderLeft:"4px solid #25d366"}}>
              {clientes[0]?generarMensaje(clientes[0])||"Completá los campos para ver la vista previa":"Agregá clientes para ver vista previa"}
            </div>
            {prod&&descPromo>0&&<div style={{marginTop:10,padding:"8px 12px",background:"#166534",borderRadius:8,fontSize:11}}>
              ✓ Promo con {descPromo}% de descuento · Margen: {prod.costo>0?((precioPromo-prod.costo)/prod.costo*100).toFixed(0):"—"}%
            </div>}
          </div>
        </div>
      )}

      {tab==="enviar"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14}}>
          <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
            <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
              {[["todos","Todos"],["mayoristas","Mayoristas"],["minoristas","Minoristas"]].map(([v,l])=>(
                <button key={v} onClick={()=>setClientesFiltro(v)} style={{padding:"4px 11px",borderRadius:20,border:"1px solid",borderColor:clientesFiltro===v?"#25d366":"#1e2840",background:clientesFiltro===v?"#25d366":"transparent",color:"#fff",fontSize:11,cursor:"pointer"}}>{l}</button>
              ))}
              <button onClick={selecTodos} style={{padding:"4px 11px",borderRadius:20,border:"1px solid #1e2840",background:"transparent",color:"#9ca3af",fontSize:11,cursor:"pointer"}}>Selec. todos</button>
              <button onClick={deselecTodos} style={{padding:"4px 11px",borderRadius:20,border:"1px solid #1e2840",background:"transparent",color:"#9ca3af",fontSize:11,cursor:"pointer"}}>Ninguno</button>
            </div>
            <div style={{marginBottom:10,fontSize:12,color:"#6b7280"}}>{seleccionados.length} cliente(s) seleccionado(s)</div>
            {clisFiltrados.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #1e2840"}}>
                <input type="checkbox" checked={seleccionados.includes(c.id)} onChange={()=>toggleSelec(c.id)} style={{width:16,height:16,cursor:"pointer"}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600}}>{c.nombre}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>📞 {c.telefono} · {c.tipoCliente}</div>
                </div>
                <button onClick={()=>enviarWA(c)} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:7,border:"none",background:"#25d366",color:"#fff",fontWeight:600,fontSize:11,cursor:"pointer"}}>
                  <span>📤</span> WhatsApp
                </button>
              </div>
            ))}
          </div>
          <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>📦 Seleccionar Promo</div>
            {promos.length===0?<div style={{color:"#6b7280",fontSize:12}}>Creá una promo primero</div>:
              promos.map(pr=>(
                <div key={pr.id} onClick={()=>{setProdSelec(productos.find(p=>p.nombre===pr.producto)?.id||"");setDescPromo(pr.descuento);setPlantilla(pr.plantilla);setTab("enviar");}} style={{padding:"9px 12px",borderRadius:8,border:"1px solid #1e2840",marginBottom:7,cursor:"pointer",background:"#0d1117"}}>
                  <div style={{fontWeight:600,fontSize:12}}>{pr.titulo}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>{pr.producto} · {pr.descuento}% off · {fmtFecC(pr.fecha)}</div>
                </div>
              ))
            }
            {seleccionados.length>0&&prodSelec&&(
              <div style={{marginTop:14}}>
                <div style={{fontWeight:600,fontSize:12,marginBottom:8}}>Enviar a {seleccionados.length} clientes:</div>
                {clientes.filter(c=>seleccionados.includes(c.id)).map(c=>(
                  <button key={c.id} onClick={()=>enviarWA(c)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",padding:"7px 10px",borderRadius:7,border:"none",background:"#0d4a2a",color:"#e8eaf0",fontWeight:500,fontSize:11,cursor:"pointer",marginBottom:4}}>
                    <span>👤 {c.nombre}</span><span style={{color:"#25d366"}}>📤 Enviar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="historial"&&(
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:15}}>
          {promos.length===0?<div style={{color:"#6b7280",textAlign:"center",padding:30}}>Sin promos guardadas</div>:
            promos.map(pr=>(
              <div key={pr.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1e2840"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{pr.titulo}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>{pr.producto} · {pr.descuento}% desc · {fmtFecC(pr.fecha)}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#25d366"}}>{fmtGs(pr.precioPromo)}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  PPP — PRECIO PROMEDIO PONDERADO
// ══════════════════════════════════════════════════════════════
function VistaPPP({productos,setProductos,promos,setPromos,notificar}) {
  const [sel,setSel]=useState(null);
  const [nuevoPrecio,setNuevoPrecio]=useState("");
  const [showPromo,setShowPromo]=useState(false);
  const [tituloPromo,setTituloPromo]=useState("");
  const [descPromo,setDescPromo]=useState(10);

  const prodsConHist=productos.filter(p=>p.historialCompras&&p.historialCompras.length>0);
  const todos=productos;

  const semaforo=(p)=>{
    const ppp=calcPPP(p.historialCompras);
    if(!ppp) return null;
    const margen=(p.precio-ppp)/ppp*100;
    if(margen>40) return {color:"#22c55e",label:"Excelente",accion:"Podés hacer promo o descuento"};
    if(margen>20) return {color:"#f59e0b",label:"Bueno",accion:"Margen saludable"};
    if(margen>0)  return {color:"#f97316",label:"Ajustado",accion:"Cuidado al hacer descuentos"};
    return {color:"#ef4444",label:"Pérdida",accion:"Precio debajo del costo!"};
  };

  const actualizarPrecio=()=>{
    if(!nuevoPrecio||!sel){notificar("Ingresá el nuevo precio","error");return;}
    setProductos(p=>p.map(x=>x.id===sel.id?{...x,precio:parseFloat(nuevoPrecio)}:x));
    notificar(`Precio actualizado a ${fmtGs(nuevoPrecio)}`);
    setSel(null);setNuevoPrecio("");
  };
  const crearPromo=()=>{
    if(!sel){return;}
    const precioPromo=Math.round(sel.precio*(1-descPromo/100));
    setPromos(p=>[{id:genId(),titulo:tituloPromo||`Promo ${sel.nombre}`,producto:sel.nombre,descuento:descPromo,precioPromo,plantilla:`🎉 Hola {nombre}! Promo especial:\n🥤 ${sel.nombre} a solo ${fmtGs(precioPromo)} (${descPromo}% OFF)!\nHasta agotar stock. Bebidas Express 📍`,fecha:hoy(),enviados:0},...p]);
    notificar("Promo creada — ir a Promos WA para enviar");setShowPromo(false);
  };

  return(
    <div style={{padding:20}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>⚖️ Precio Promedio Ponderado (PPP)</h2>
      <p style={{fontSize:12,color:"#9ca3af",marginBottom:16}}>Cuando comprás el mismo artículo en diferentes momentos y precios, el sistema calcula tu costo real promedio. Usalo para decidir si podés hacer promo, dar descuento, o si conviene subir el precio.</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12}}>
        {todos.map(p=>{
          const ppp=calcPPP(p.historialCompras);
          const sem=semaforo(p);
          const margen=ppp>0?((p.precio-ppp)/ppp*100).toFixed(1):null;
          const histActivo=p.historialCompras||[];
          return(
            <div key={p.id} style={{background:"#111827",border:`1px solid ${sel?.id===p.id?"#4f46e5":"#1e2840"}`,borderRadius:12,padding:15,cursor:"pointer"}} onClick={()=>setSel(sel?.id===p.id?null:p)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:26}}>{p.imagen}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>{p.rubro}</div>
                </div>
                {sem&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:sem.color+"25",color:sem.color,fontWeight:600}}>{sem.label}</span>}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                <div style={{background:"#0d1117",borderRadius:7,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#6b7280"}}>Precio venta</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#818cf8"}}>{fmtGs(p.precio)}</div>
                </div>
                <div style={{background:"#0d1117",borderRadius:7,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#6b7280"}}>PPP (costo real)</div>
                  <div style={{fontSize:14,fontWeight:700,color:ppp?sem?.color||"#6b7280":"#6b7280"}}>{ppp?fmtGs(ppp):"Sin historial"}</div>
                </div>
              </div>

              {ppp>0&&<>
                <div style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:2}}>
                    <span style={{color:"#6b7280"}}>Margen sobre PPP</span>
                    <span style={{color:sem?.color,fontWeight:700}}>{margen}%</span>
                  </div>
                  <div style={{width:"100%",height:6,background:"#1e2840",borderRadius:4}}>
                    <div style={{width:`${Math.min(100,Math.max(0,parseFloat(margen)))}%`,height:"100%",background:sem?.color||"#6b7280",borderRadius:4}}/>
                  </div>
                </div>
                {sem&&<div style={{fontSize:10,color:sem.color,marginBottom:8}}>💡 {sem.accion}</div>}
              </>}

              {histActivo.length>0&&(
                <div style={{fontSize:10,color:"#6b7280",marginBottom:8}}>
                  {histActivo.length} compra(s) · último: {fmtGs(histActivo[histActivo.length-1]?.precioUnitario||0)}/u
                </div>
              )}

              {histActivo.length>1&&(
                <div style={{maxHeight:70,overflow:"auto",background:"#0d1117",borderRadius:7,padding:"5px 8px"}}>
                  {[...histActivo].reverse().map((h,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"2px 0",color:"#6b7280"}}>
                      <span>{fmtFecC(h.fecha)} · {h.cantidad} u.</span><span>{fmtGs(h.precioUnitario)}/u</span>
                    </div>
                  ))}
                </div>
              )}

              {sel?.id===p.id&&ppp>0&&(
                <div style={{marginTop:10,display:"flex",gap:6}}>
                  <button onClick={(e)=>{e.stopPropagation();setNuevoPrecio(p.precio);}} style={{flex:1,padding:"7px",borderRadius:7,border:"none",background:"#1e3a5f",color:"#60a5fa",fontWeight:600,fontSize:10,cursor:"pointer"}}>✏ Ajustar precio</button>
                  {sem&&(sem.label==="Excelente"||sem.label==="Bueno")&&<button onClick={(e)=>{e.stopPropagation();setShowPromo(true);}} style={{flex:1,padding:"7px",borderRadius:7,border:"none",background:"#166534",color:"#22c55e",fontWeight:600,fontSize:10,cursor:"pointer"}}>📣 Crear promo</button>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sel&&nuevoPrecio&&<Modal onClose={()=>{setSel(null);setNuevoPrecio("");}} titulo={`✏ Ajustar precio — ${sel.nombre}`}>
        <div style={{background:"#0d1117",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#9ca3af"}}>PPP (costo real)</span><span>{fmtGs(calcPPP(sel.historialCompras))}</span></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#9ca3af"}}>Precio actual</span><span style={{color:"#818cf8"}}>{fmtGs(sel.precio)}</span></div>
        </div>
        <div style={{marginBottom:10}}><div style={LBL}>Nuevo precio de venta (Gs.)</div>
          <input type="number" value={nuevoPrecio} onChange={e=>setNuevoPrecio(e.target.value)} style={{...IS,width:"100%",fontSize:16,fontWeight:700}}/>
        </div>
        {nuevoPrecio&&<div style={{marginBottom:10,padding:"8px 12px",background:"#0d1117",borderRadius:8,fontSize:11}}>
          <div style={{color:"#9ca3af"}}>Nuevo margen sobre PPP:</div>
          <div style={{fontSize:16,fontWeight:700,color:"#22c55e"}}>{((parseFloat(nuevoPrecio)-calcPPP(sel.historialCompras))/calcPPP(sel.historialCompras)*100).toFixed(1)}%</div>
        </div>}
        <button onClick={actualizarPrecio} style={{...BTNP,width:"100%"}}>✓ Actualizar Precio</button>
      </Modal>}

      {showPromo&&sel&&<Modal onClose={()=>setShowPromo(false)} titulo={`📣 Crear promo — ${sel.nombre}`}>
        <div style={{marginBottom:9}}><div style={LBL}>Título de la promo</div><input value={tituloPromo} onChange={e=>setTituloPromo(e.target.value)} placeholder={`Promo ${sel.nombre}`} style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:9}}><div style={LBL}>Descuento: {descPromo}%</div>
          <input type="range" min="5" max="40" value={descPromo} onChange={e=>setDescPromo(Number(e.target.value))} style={{width:"100%"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:3}}>
            <span style={{color:"#9ca3af"}}>Normal: {fmtGs(sel.precio)}</span>
            <span style={{color:"#22c55e",fontWeight:700}}>Promo: {fmtGs(Math.round(sel.precio*(1-descPromo/100)))}</span>
          </div>
          <div style={{fontSize:10,color:"#6b7280",marginTop:3}}>Margen con promo: {calcPPP(sel.historialCompras)>0?((Math.round(sel.precio*(1-descPromo/100))-calcPPP(sel.historialCompras))/calcPPP(sel.historialCompras)*100).toFixed(1):"—"}%</div>
        </div>
        <button onClick={crearPromo} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"linear-gradient(135deg,#25d366,#128c7e)",color:"#fff",fontWeight:700,cursor:"pointer"}}>✓ Crear y guardar promo</button>
      </Modal>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  METAS
// ══════════════════════════════════════════════════════════════
function VistaMetas({metas,setMetas,ventas,totalHoy,pctMeta}) {
  const [formM,setFormM]=useState({...metas});
  const semana=Array(7).fill(0);
  ventas.forEach(v=>{const d=new Date(v.fecha).getDay();semana[d]+=v.total;});
  const diasNom=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const maxSem=Math.max(...semana,1);
  const totalSem=semana.reduce((s,x)=>s+x,0);
  const pctSem=Math.min(100,Math.round((totalSem/metas.semanal)*100));

  return(
    <div style={{padding:20,maxWidth:800,margin:"0 auto"}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:18}}>🎯 Metas de Ventas</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
        {[{l:"Meta Diaria",pct:pctMeta,total:totalHoy,meta:metas.diaria},{l:"Meta Semanal",pct:pctSem,total:totalSem,meta:metas.semanal}].map(({l,pct,total,meta})=>(
          <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:12,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:13}}>{l}</div>
              <div style={{fontSize:12,fontWeight:700,color:pct>=100?"#22c55e":"#818cf8"}}>{pct}%</div>
            </div>
            <div style={{width:"100%",height:14,background:"#1e2840",borderRadius:7,overflow:"hidden",marginBottom:8}}>
              <div style={{width:`${pct}%`,height:"100%",background:pct>=100?"linear-gradient(90deg,#16a34a,#22c55e)":"linear-gradient(90deg,#4f46e5,#818cf8)",borderRadius:7,transition:"width .5s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
              <span style={{color:"#9ca3af"}}>Alcanzado: {fmtGs(total)}</span>
              <span style={{color:"#6b7280"}}>Meta: {fmtGs(meta)}</span>
            </div>
            {pct>=100&&<div style={{marginTop:6,fontSize:11,color:"#22c55e"}}>🎉 ¡Meta superada!</div>}
            {pct<100&&<div style={{marginTop:6,fontSize:11,color:"#6b7280"}}>Faltan: {fmtGs(meta-total)}</div>}
          </div>
        ))}
      </div>

      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>📊 Ventas por día (esta semana)</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:90}}>
          {semana.map((v,d)=>(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              {v>0&&<div style={{fontSize:9,color:"#6b7280"}}>{fmtGs(v).replace("Gs. ","")}</div>}
              <div style={{width:"100%",background:v>0?"#4f46e5":"#1e2840",borderRadius:"4px 4px 0 0",height:`${Math.max(4,(v/maxSem)*70)}px`,transition:"height .3s"}}/>
              <div style={{fontSize:10,color:d===new Date().getDay()?"#818cf8":"#6b7280",fontWeight:d===new Date().getDay()?700:400}}>{diasNom[d]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:12,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>⚙ Configurar Metas</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={LBL}>Meta diaria (Gs.)</div><input type="number" value={formM.diaria} onChange={e=>setFormM(p=>({...p,diaria:parseFloat(e.target.value)||0}))} style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Meta semanal (Gs.)</div><input type="number" value={formM.semanal} onChange={e=>setFormM(p=>({...p,semanal:parseFloat(e.target.value)||0}))} style={{...IS,width:"100%"}}/></div>
        </div>
        <button onClick={()=>setMetas({...formM})} style={{...BTNP,width:"100%"}}>✓ Guardar Metas</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CAJA + TURNOS
// ══════════════════════════════════════════════════════════════
function VistaCaja({caja,setCaja,saldoCaja,notificar,usuarioActual,setUsuarioActual,funcionarios}) {
  const [montoAp,setMontoAp]=useState("");
  const [movD,setMovD]=useState("");const [movM,setMovM]=useState("");
  const [movT,setMovT]=useState("egreso");const [movCat,setMovCat]=useState("otros");
  const [showCierre,setShowCierre]=useState(false);

  const abrir=()=>{
    if(!montoAp||parseFloat(montoAp)<0){notificar("Monto inválido","error");return;}
    setCaja({abierta:true,saldoInicial:parseFloat(montoAp),apertura:hoy(),movimientos:[],turnos:[{usuario:usuarioActual,apertura:hoy(),saldoInicial:parseFloat(montoAp)}]});
    setMontoAp("");notificar(`Caja abierta por ${usuarioActual}`);
  };
  const cerrar=()=>{
    setCaja(p=>({...p,abierta:false,turnos:p.turnos.map((t,i)=>i===p.turnos.length-1?{...t,cierre:hoy(),saldoCierre:saldoCaja}:t)}));
    setShowCierre(false);notificar("Caja cerrada");
  };
  const addMov=()=>{if(!movD||!movM){notificar("Completá descripción y monto","error");return;}setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:movT,monto:parseFloat(movM),desc:movD,fecha:hoy(),cat:movCat,usuario:usuarioActual}]}));setMovD("");setMovM("");notificar("Movimiento registrado");};

  const ingr=caja.movimientos.filter(m=>m.tipo==="ingreso").reduce((s,m)=>s+m.monto,0);
  const egr =caja.movimientos.filter(m=>m.tipo==="egreso" ).reduce((s,m)=>s+m.monto,0);

  return(
    <div style={{padding:20,maxWidth:980,margin:"0 auto"}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>💰 Gestión de Caja</h2>
      {!caja.abierta?(
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:14,padding:28,maxWidth:400,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔒</div>
          <div style={{fontWeight:700,fontSize:17,marginBottom:5}}>Caja Cerrada</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Turno de:</div>
          <select value={usuarioActual} onChange={e=>setUsuarioActual(e.target.value)} style={{...IS,width:"100%",marginBottom:10,textAlign:"center"}}>
            {["Admin",...funcionarios.filter(f=>f.activo).map(f=>f.nombre)].map(n=><option key={n}>{n}</option>)}
          </select>
          <input type="number" value={montoAp} onChange={e=>setMontoAp(e.target.value)} placeholder="Fondo inicial (Gs.)" style={{...IS,width:"100%",fontSize:15,marginBottom:10,textAlign:"center"}}/>
          <button onClick={abrir} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>🔓 ABRIR CAJA</button>
        </div>
      ):(
        <>
          <div style={{background:"#1a3a1a",border:"1px solid #166534",borderRadius:9,padding:"10px 14px",marginBottom:14,fontSize:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#22c55e"}}>✓ Caja abierta por <strong>{usuarioActual}</strong></span>
            <span style={{color:"#6b7280"}}>Desde: {caja.apertura?fmtFec(caja.apertura):"—"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[{l:"Saldo Actual",v:fmtGs(saldoCaja),c:"#22c55e"},{l:"Fondo Inicial",v:fmtGs(caja.saldoInicial),c:"#818cf8"},{l:"Ingresos",v:fmtGs(ingr),c:"#22c55e"},{l:"Egresos",v:fmtGs(egr),c:"#ef4444"}].map(({l,v,c})=>(
              <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div></div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.3fr",gap:14}}>
            <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:14}}>
              <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>➕ Nuevo Movimiento</div>
              <div style={{display:"flex",gap:5,marginBottom:8}}>
                {["ingreso","egreso"].map(t=><button key={t} onClick={()=>setMovT(t)} style={{flex:1,padding:7,borderRadius:7,border:"none",cursor:"pointer",background:movT===t?(t==="ingreso"?"#166534":"#7f1d1d"):"#1e2840",color:movT===t?"#fff":"#9ca3af",fontWeight:600,fontSize:11}}>{t==="ingreso"?"↑ Ingreso":"↓ Egreso"}</button>)}
              </div>
              <select value={movCat} onChange={e=>setMovCat(e.target.value)} style={{...IS,width:"100%",marginBottom:7}}>
                {[["venta","Ventas"],["compra","Compra mercadería"],["gasto_fijo","Gasto fijo"],["gasto_var","Gasto variable"],["proveedor","Pago proveedor"],["salario","Salario"],["adelanto","Adelanto personal"],["retiro","Retiro/Propietario"],["consignacion","Consignación"],["otros","Otros"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <input value={movD} onChange={e=>setMovD(e.target.value)} placeholder="Descripción" style={{...IS,width:"100%",marginBottom:7}}/>
              <input type="number" value={movM} onChange={e=>setMovM(e.target.value)} placeholder="Monto (Gs.)" style={{...IS,width:"100%",marginBottom:9}}/>
              <button onClick={addMov} style={{width:"100%",padding:8,borderRadius:7,border:"none",background:"#4f46e5",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12}}>Registrar</button>
            </div>
            <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:14}}>
              <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>📋 Movimientos del turno</div>
              <div style={{maxHeight:280,overflow:"auto"}}>
                {caja.movimientos.length===0?<div style={{color:"#6b7280",fontSize:12,textAlign:"center",marginTop:16}}>Sin movimientos</div>:
                  [...caja.movimientos].reverse().map((m,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1e2840",fontSize:11}}>
                      <div>
                        <div style={{fontWeight:500}}>{m.desc}</div>
                        <div style={{fontSize:9,color:"#6b7280"}}>{m.cat} · {m.usuario||""} · {fmtFec(m.fecha)}</div>
                      </div>
                      <div style={{fontWeight:700,color:m.tipo==="ingreso"?"#22c55e":"#ef4444",whiteSpace:"nowrap"}}>{m.tipo==="ingreso"?"+":"−"}{fmtGs(m.monto)}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          <div style={{marginTop:14,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>setShowCierre(true)} style={{padding:"9px 20px",borderRadius:9,border:"none",background:"#7f1d1d",color:"#fca5a5",fontWeight:700,cursor:"pointer",fontSize:12}}>🔒 Cerrar Caja</button>
          </div>
        </>
      )}
      {showCierre&&<Modal onClose={()=>setShowCierre(false)} titulo="🔒 Cierre de Caja">
        <div style={{background:"#0d1117",borderRadius:9,padding:13,marginBottom:12,fontSize:13}}>
          {[["Responsable",usuarioActual],["Apertura",fmtFec(caja.apertura)],["Fondo inicial",fmtGs(caja.saldoInicial)],["Ingresos",fmtGs(ingr)],["Egresos",fmtGs(egr)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:"#9ca3af"}}>{k}</span><span>{v}</span></div>
          ))}
          <div style={{borderTop:"1px solid #1e2840",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:16}}><span>SALDO FINAL</span><span style={{color:"#818cf8"}}>{fmtGs(saldoCaja)}</span></div>
        </div>
        <button onClick={cerrar} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"#7f1d1d",color:"#fca5a5",fontWeight:700,cursor:"pointer"}}>Confirmar Cierre</button>
      </Modal>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  CLIENTES, PROVEEDORES, RRHH, GASTOS, CATALOGO, VENTAS, FINANZAS
//  (versiones compactas que mantienen toda la funcionalidad)
// ══════════════════════════════════════════════════════════════
function VistaClientes({clientes,setClientes,ventas,notificar}) {
  const [showF,setShowF]=useState(false);const [edit,setEdit]=useState(null);
  const [form,setForm]=useState({nombre:"",ruc:"",telefono:"",email:"",direccion:"",tipoCliente:"minorista"});
  const abrir=(c=null)=>{setEdit(c);setForm(c?{...c}:{nombre:"",ruc:"",telefono:"",email:"",direccion:"",tipoCliente:"minorista"});setShowF(true);};
  const guardar=()=>{if(!form.nombre){notificar("Nombre requerido","error");return;}if(edit)setClientes(p=>p.map(x=>x.id===edit.id?{...form,id:edit.id,credito:edit.credito,compras:edit.compras}:x));else setClientes(p=>[...p,{...form,id:genId(),credito:0,compras:[]}]);notificar(edit?"Actualizado":"Agregado");setShowF(false);};
  return(
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700}}>👥 Clientes</h2><button onClick={()=>abrir()} style={BTNP}>+ Nuevo</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:11}}>
        {clientes.map(c=>{const comp=ventas.filter(v=>v.clienteId===c.id);return(
          <div key={c.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{c.nombre}</div><div style={{fontSize:10,color:"#6b7280"}}>RUC: {c.ruc} · {c.tipoCliente}</div></div>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>abrir(c)} style={{padding:"2px 7px",borderRadius:5,border:"none",background:"#1e3a5f",color:"#60a5fa",fontSize:10,cursor:"pointer"}}>✏</button>
                <button onClick={()=>{setClientes(p=>p.filter(x=>x.id!==c.id));notificar("Eliminado");}} style={{padding:"2px 7px",borderRadius:5,border:"none",background:"#7f1d1d",color:"#fca5a5",fontSize:10,cursor:"pointer"}}>🗑</button>
              </div>
            </div>
            <div style={{fontSize:11,color:"#9ca3af"}}>📞 {c.telefono} · ✉ {c.email}</div>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>📍 {c.direccion}</div>
            <div style={{display:"flex",gap:8,borderTop:"1px solid #1e2840",paddingTop:8}}>
              <div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:"#6b7280"}}>Compras</div><div style={{fontWeight:700,color:"#818cf8"}}>{comp.length}</div></div>
              <div style={{textAlign:"center",flex:1}}><div style={{fontSize:9,color:"#6b7280"}}>Total</div><div style={{fontWeight:600,fontSize:11,color:"#22c55e"}}>{fmtGs(comp.reduce((s,v)=>s+v.total,0))}</div></div>
            </div>
          </div>
        );})}
      </div>
      {showF&&<Modal onClose={()=>setShowF(false)} titulo={edit?"✏ Editar":"➕ Nuevo Cliente"}>
        {[["Nombre *","nombre","text"],["RUC","ruc","text"],["Teléfono","telefono","text"],["Email","email","email"],["Dirección","direccion","text"]].map(([l,k,t])=>(
          <div key={k} style={{marginBottom:8}}><div style={LBL}>{l}</div><input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        ))}
        <div style={{marginBottom:8}}><div style={LBL}>Tipo</div><select value={form.tipoCliente} onChange={e=>setForm(p=>({...p,tipoCliente:e.target.value}))} style={{...IS,width:"100%"}}><option value="minorista">Minorista</option><option value="mayorista">Mayorista</option></select></div>
        <button onClick={guardar} style={{...BTNP,width:"100%",marginTop:4}}>✓ {edit?"Guardar":"Agregar"}</button>
      </Modal>}
    </div>
  );
}

function VistaProveedores({proveedores,setProveedores,setCaja,notificar}) {
  const [showF,setShowF]=useState(false);const [edit,setEdit]=useState(null);const [showP,setShowP]=useState(null);
  const [montoP,setMontoP]=useState("");const [concP,setConcP]=useState("");
  const [form,setForm]=useState({nombre:"",ruc:"",telefono:"",email:"",saldo:0});
  const abrir=(p=null)=>{setEdit(p);setForm(p?{...p}:{nombre:"",ruc:"",telefono:"",email:"",saldo:0});setShowF(true);};
  const guardar=()=>{if(!form.nombre){notificar("Nombre requerido","error");return;}if(edit)setProveedores(p=>p.map(x=>x.id===edit.id?{...form,id:edit.id,pagos:edit.pagos,compras:edit.compras}:x));else setProveedores(p=>[...p,{...form,id:genId(),saldo:parseFloat(form.saldo)||0,pagos:[],compras:[]}]);notificar(edit?"Actualizado":"Agregado");setShowF(false);};
  const pagar=()=>{if(!montoP||parseFloat(montoP)<=0){notificar("Monto inválido","error");return;}const m=parseFloat(montoP);setProveedores(p=>p.map(x=>x.id===showP.id?{...x,saldo:Math.max(0,x.saldo-m),pagos:[...x.pagos,{monto:m,concepto:concP||"Pago",fecha:hoy()}]}:x));setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:m,desc:`Pago ${showP.nombre}`,fecha:hoy(),cat:"proveedor"}]}));notificar(`Pago ${fmtGs(m)}`);setShowP(null);setMontoP("");setConcP("");};
  return(
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700}}>🏭 Proveedores</h2><button onClick={()=>abrir()} style={BTNP}>+ Nuevo</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:11}}>
        {proveedores.map(p=>(
          <div key={p.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div><div style={{fontSize:10,color:"#6b7280"}}>RUC: {p.ruc}</div></div>
              <button onClick={()=>abrir(p)} style={{padding:"2px 7px",borderRadius:5,border:"none",background:"#1e3a5f",color:"#60a5fa",fontSize:10,cursor:"pointer"}}>✏</button>
            </div>
            <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>📞 {p.telefono} · ✉ {p.email}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0d1117",borderRadius:8,padding:"9px 11px",marginBottom:9}}>
              <div><div style={{fontSize:9,color:"#6b7280"}}>Deuda pendiente</div><div style={{fontSize:16,fontWeight:700,color:p.saldo>0?"#ef4444":"#22c55e"}}>{fmtGs(p.saldo)}</div></div>
              {p.saldo>0&&<button onClick={()=>setShowP(p)} style={{padding:"6px 12px",borderRadius:7,border:"none",background:"#166534",color:"#22c55e",fontWeight:600,fontSize:11,cursor:"pointer"}}>💵 Pagar</button>}
            </div>
            <div style={{fontSize:10,color:"#6b7280"}}>{p.compras.length} compras registradas · {p.pagos.length} pagos</div>
          </div>
        ))}
      </div>
      {showF&&<Modal onClose={()=>setShowF(false)} titulo={edit?"✏ Editar":"➕ Nuevo Proveedor"}>
        {[["Nombre *","nombre","text"],["RUC","ruc","text"],["Teléfono","telefono","text"],["Email","email","email"]].map(([l,k,t])=>(<div key={k} style={{marginBottom:8}}><div style={LBL}>{l}</div><input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{...IS,width:"100%"}}/></div>))}
        <div style={{marginBottom:8}}><div style={LBL}>Saldo inicial (deuda)</div><input type="number" value={form.saldo} onChange={e=>setForm(p=>({...p,saldo:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        <button onClick={guardar} style={{...BTNP,width:"100%",marginTop:4}}>✓ {edit?"Guardar":"Agregar"}</button>
      </Modal>}
      {showP&&<Modal onClose={()=>setShowP(null)} titulo={`💵 Pagar a ${showP.nombre}`}>
        <div style={{marginBottom:9}}><div style={LBL}>Concepto</div><input value={concP} onChange={e=>setConcP(e.target.value)} placeholder="Factura, mercadería..." style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:9}}><div style={LBL}>Monto (Gs.) — Deuda: {fmtGs(showP.saldo)}</div><input type="number" value={montoP} onChange={e=>setMontoP(e.target.value)} style={{...IS,width:"100%",fontSize:16,fontWeight:700}}/></div>
        <button onClick={pagar} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontWeight:700,cursor:"pointer"}}>✓ Registrar Pago</button>
      </Modal>}
    </div>
  );
}

function VistaRRHH({funcionarios,setFuncionarios,setCaja,notificar}) {
  const [showF,setShowF]=useState(false);const [edit,setEdit]=useState(null);const [showA,setShowA]=useState(null);const [showS,setShowS]=useState(null);
  const [montoA,setMontoA]=useState("");const [tipoA,setTipoA]=useState("adelanto");
  const [form,setForm]=useState({nombre:"",cargo:"",salario:""});
  const abrir=(f=null)=>{setEdit(f);setForm(f?{nombre:f.nombre,cargo:f.cargo,salario:f.salario}:{nombre:"",cargo:"",salario:""});setShowF(true);};
  const guardar=()=>{if(!form.nombre){notificar("Nombre requerido","error");return;}if(edit)setFuncionarios(p=>p.map(x=>x.id===edit.id?{...x,...form,salario:parseFloat(form.salario)||0}:x));else setFuncionarios(p=>[...p,{...form,id:genId(),salario:parseFloat(form.salario)||0,activo:true,adelantos:[]}]);notificar(edit?"Actualizado":"Agregado");setShowF(false);};
  const pagarA=()=>{if(!montoA||parseFloat(montoA)<=0){notificar("Monto inválido","error");return;}const m=parseFloat(montoA);setFuncionarios(p=>p.map(x=>x.id===showA.id?{...x,adelantos:[...x.adelantos,{monto:m,tipo:tipoA,fecha:hoy(),pagado:false}]}:x));setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:m,desc:`${tipoA==="adelanto"?"Adelanto":"Retiro"}: ${showA.nombre}`,fecha:hoy(),cat:tipoA}]}));notificar(`${fmtGs(m)} registrado`);setShowA(null);setMontoA("");};
  const pagarS=(f)=>{const adel=f.adelantos.filter(a=>a.tipo==="adelanto"&&!a.pagado).reduce((s,a)=>s+a.monto,0);const neto=Math.max(0,f.salario-adel);setFuncionarios(p=>p.map(x=>x.id===f.id?{...x,adelantos:x.adelantos.map(a=>({...a,pagado:true}))}:x));setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:neto,desc:`Salario: ${f.nombre}`,fecha:hoy(),cat:"salario"}]}));notificar(`Salario neto ${fmtGs(neto)} pagado`);setShowS(null);};
  return(
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{fontSize:18,fontWeight:700}}>👔 Personal</h2><button onClick={()=>abrir()} style={BTNP}>+ Agregar</button></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:11}}>
        {funcionarios.map(f=>{const adel=f.adelantos.filter(a=>a.tipo==="adelanto"&&!a.pagado).reduce((s,a)=>s+a.monto,0);return(
          <div key={f.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:11,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{f.nombre}</div><span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:"#4f46e520",color:"#818cf8"}}>{f.cargo}</span></div>
              <div style={{display:"flex",gap:4}}><button onClick={()=>abrir(f)} style={{padding:"2px 7px",borderRadius:5,border:"none",background:"#1e3a5f",color:"#60a5fa",fontSize:10,cursor:"pointer"}}>✏</button><button onClick={()=>setFuncionarios(p=>p.map(x=>x.id===f.id?{...x,activo:!x.activo}:x))} style={{padding:"2px 7px",borderRadius:5,border:"none",background:f.activo?"#166534":"#374151",color:f.activo?"#22c55e":"#9ca3af",fontSize:10,cursor:"pointer"}}>{f.activo?"✓":"✗"}</button></div>
            </div>
            <div style={{background:"#0d1117",borderRadius:8,padding:"9px 11px",marginBottom:9,fontSize:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#9ca3af"}}>Salario bruto</span><span>{fmtGs(f.salario)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#f59e0b"}}>Adelantos pend.</span><span style={{color:"#f59e0b"}}>−{fmtGs(adel)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px dashed #1e2840",paddingTop:5,fontWeight:700}}><span>A pagar</span><span style={{color:"#22c55e"}}>{fmtGs(Math.max(0,f.salario-adel))}</span></div>
            </div>
            <div style={{display:"flex",gap:5}}>
              <button onClick={()=>{setShowA(f);setTipoA("adelanto");}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"#78350f30",color:"#f59e0b",fontWeight:600,fontSize:10,cursor:"pointer"}}>💵 Adelanto</button>
              <button onClick={()=>{setShowA(f);setTipoA("retiro");}} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"#7f1d1d30",color:"#fca5a5",fontWeight:600,fontSize:10,cursor:"pointer"}}>↩ Retiro</button>
              <button onClick={()=>setShowS(f)} style={{flex:1,padding:"6px",borderRadius:6,border:"none",background:"#16603430",color:"#22c55e",fontWeight:600,fontSize:10,cursor:"pointer"}}>✓ Salario</button>
            </div>
          </div>
        );})}
      </div>
      {showF&&<Modal onClose={()=>setShowF(false)} titulo={edit?"✏ Editar":"➕ Nuevo Funcionario"}>
        {[["Nombre *","nombre"],["Cargo","cargo"]].map(([l,k])=>(<div key={k} style={{marginBottom:8}}><div style={LBL}>{l}</div><input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{...IS,width:"100%"}}/></div>))}
        <div style={{marginBottom:8}}><div style={LBL}>Salario mensual (Gs.)</div><input type="number" value={form.salario} onChange={e=>setForm(p=>({...p,salario:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        <button onClick={guardar} style={{...BTNP,width:"100%",marginTop:4}}>✓ {edit?"Guardar":"Agregar"}</button>
      </Modal>}
      {showA&&<Modal onClose={()=>setShowA(null)} titulo={`${tipoA==="adelanto"?"💵 Adelanto":"↩ Retiro"} — ${showA.nombre}`}>
        <div style={{marginBottom:9}}><div style={LBL}>Monto (Gs.)</div><input type="number" value={montoA} onChange={e=>setMontoA(e.target.value)} style={{...IS,width:"100%",fontSize:16,fontWeight:700}}/></div>
        <button onClick={pagarA} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:tipoA==="adelanto"?"linear-gradient(135deg,#d97706,#b45309)":"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",fontWeight:700,cursor:"pointer"}}>✓ Confirmar</button>
      </Modal>}
      {showS&&<Modal onClose={()=>setShowS(null)} titulo={`✓ Pagar Salario — ${showS.nombre}`}>
        <div style={{background:"#0d1117",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#9ca3af"}}>Bruto</span><span>{fmtGs(showS.salario)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#f59e0b"}}>Adelantos</span><span style={{color:"#f59e0b"}}>−{fmtGs(showS.adelantos.filter(a=>a.tipo==="adelanto"&&!a.pagado).reduce((s,a)=>s+a.monto,0))}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}><span>NETO</span><span style={{color:"#22c55e"}}>{fmtGs(Math.max(0,showS.salario-showS.adelantos.filter(a=>a.tipo==="adelanto"&&!a.pagado).reduce((s,a)=>s+a.monto,0)))}</span></div>
        </div>
        <button onClick={()=>pagarS(showS)} style={{width:"100%",padding:11,borderRadius:9,border:"none",background:"linear-gradient(135deg,#16a34a,#15803d)",color:"#fff",fontWeight:700,cursor:"pointer"}}>✓ Confirmar Pago</button>
      </Modal>}
    </div>
  );
}

function VistaGastos({gastosFijos,setGastosFijos,gastosVar,setGastosVar,setCaja,notificar}) {
  const [tab,setTab]=useState("fijos");const [showGF,setShowGF]=useState(false);const [editGF,setEditGF]=useState(null);const [showGV,setShowGV]=useState(false);
  const [formGF,setFormGF]=useState({concepto:"",monto:"",frecuencia:"mensual",categoria:"otros"});
  const [formGV,setFormGV]=useState({concepto:"",monto:"",categoria:"reparacion",fecha:new Date().toISOString().slice(0,10)});
  const CCAT=[["alquiler","🏠 Alquiler"],["servicios","⚡ Servicios"],["salario","👔 Salarios"],["reparacion","🔧 Reparación"],["transporte","🚗 Transporte"],["otros","📌 Otros"]];
  const gfT=gastosFijos.filter(g=>g.activo).reduce((s,g)=>s+g.monto,0);
  const gvT=gastosVar.reduce((s,g)=>s+g.monto,0);
  const guardarGF=()=>{if(!formGF.concepto||!formGF.monto){notificar("Completá campos","error");return;}if(editGF)setGastosFijos(p=>p.map(x=>x.id===editGF.id?{...formGF,id:editGF.id,monto:parseFloat(formGF.monto),activo:editGF.activo}:x));else setGastosFijos(p=>[...p,{...formGF,id:genId(),monto:parseFloat(formGF.monto),activo:true}]);notificar("Guardado");setShowGF(false);};
  const regGV=()=>{if(!formGV.concepto||!formGV.monto){notificar("Completá campos","error");return;}const g={...formGV,id:genId(),monto:parseFloat(formGV.monto)};setGastosVar(p=>[g,...p]);setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:g.monto,desc:`Gasto: ${g.concepto}`,fecha:hoy(),cat:g.categoria}]}));notificar(`Gasto ${fmtGs(g.monto)} registrado`);setShowGV(false);setFormGV({concepto:"",monto:"",categoria:"reparacion",fecha:new Date().toISOString().slice(0,10)});};
  return(
    <div style={{padding:20}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:14}}>💸 Gastos</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Gastos Fijos/mes",v:fmtGs(gfT),c:"#ef4444"},{l:"Gastos Variables",v:fmtGs(gvT),c:"#f59e0b"},{l:"Total",v:fmtGs(gfT+gvT),c:"#818cf8"}].map(({l,v,c})=>(
          <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {["fijos","variables"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"5px 14px",borderRadius:7,border:"none",cursor:"pointer",background:tab===t?"#4f46e5":"#1e2840",color:"#fff",fontSize:12,fontWeight:600}}>{t==="fijos"?"📌 Gastos Fijos":"🔧 Variables"}</button>)}
      </div>
      {tab==="fijos"?(<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><button onClick={()=>{setEditGF(null);setFormGF({concepto:"",monto:"",frecuencia:"mensual",categoria:"otros"});setShowGF(true);}} style={BTNP}>+ Agregar</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
          {gastosFijos.map(g=>(
            <div key={g.id} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:13,opacity:g.activo?1:0.5}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <div><div style={{fontWeight:600,fontSize:12}}>{g.concepto}</div><div style={{fontSize:9,color:"#6b7280"}}>{CCAT.find(c=>c[0]===g.categoria)?.[1]} · {g.frecuencia}</div></div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>{setEditGF(g);setFormGF({concepto:g.concepto,monto:g.monto,frecuencia:g.frecuencia,categoria:g.categoria});setShowGF(true);}} style={{padding:"2px 6px",borderRadius:4,border:"none",background:"#1e3a5f",color:"#60a5fa",fontSize:9,cursor:"pointer"}}>✏</button>
                  <button onClick={()=>setGastosFijos(p=>p.map(x=>x.id===g.id?{...x,activo:!x.activo}:x))} style={{padding:"2px 6px",borderRadius:4,border:"none",background:g.activo?"#166534":"#374151",color:g.activo?"#22c55e":"#9ca3af",fontSize:9,cursor:"pointer"}}>{g.activo?"✓":"✗"}</button>
                </div>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"#ef4444",marginBottom:8}}>{fmtGs(g.monto)}</div>
              <button onClick={()=>{setCaja(p=>({...p,movimientos:[...p.movimientos,{tipo:"egreso",monto:g.monto,desc:`Gasto fijo: ${g.concepto}`,fecha:hoy(),cat:g.categoria}]}));notificar(`Pago ${g.concepto} registrado`);}} style={{width:"100%",padding:"6px",borderRadius:6,border:"none",background:"#7f1d1d30",color:"#fca5a5",fontWeight:600,fontSize:10,cursor:"pointer"}}>💸 Registrar Pago</button>
            </div>
          ))}
        </div>
      </>):(<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><button onClick={()=>setShowGV(true)} style={BTNP}>+ Registrar Gasto</button></div>
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,overflow:"hidden"}}>
          {gastosVar.length===0?<div style={{textAlign:"center",padding:28,color:"#6b7280",fontSize:12}}>Sin gastos variables</div>:(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#0d1117"}}>
                {["Fecha","Concepto","Categoría","Monto"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,color:"#6b7280",borderBottom:"1px solid #1e2840"}}>{h}</th>)}
              </tr></thead>
              <tbody>{gastosVar.map(g=><tr key={g.id} style={{borderBottom:"1px solid #1e2840"}}>
                <td style={{padding:"8px 12px",fontSize:11,color:"#9ca3af"}}>{g.fecha}</td>
                <td style={{padding:"8px 12px",fontSize:12}}>{g.concepto}</td>
                <td style={{padding:"8px 12px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"#1e2840",color:"#9ca3af"}}>{CCAT.find(c=>c[0]===g.categoria)?.[1]||g.categoria}</span></td>
                <td style={{padding:"8px 12px",fontWeight:700,color:"#ef4444"}}>{fmtGs(g.monto)}</td>
              </tr>)}</tbody>
            </table>
          )}
        </div>
      </>)}
      {showGF&&<Modal onClose={()=>setShowGF(false)} titulo={editGF?"✏ Editar Gasto Fijo":"➕ Nuevo Gasto Fijo"}>
        <div style={{marginBottom:8}}><div style={LBL}>Concepto *</div><input value={formGF.concepto} onChange={e=>setFormGF(p=>({...p,concepto:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:8}}><div style={LBL}>Categoría</div><select value={formGF.categoria} onChange={e=>setFormGF(p=>({...p,categoria:e.target.value}))} style={{...IS,width:"100%"}}>{CCAT.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <div style={{marginBottom:8}}><div style={LBL}>Monto (Gs.) *</div><input type="number" value={formGF.monto} onChange={e=>setFormGF(p=>({...p,monto:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:8}}><div style={LBL}>Frecuencia</div><select value={formGF.frecuencia} onChange={e=>setFormGF(p=>({...p,frecuencia:e.target.value}))} style={{...IS,width:"100%"}}>{["mensual","quincenal","semanal","anual"].map(f=><option key={f}>{f}</option>)}</select></div>
        <button onClick={guardarGF} style={{...BTNP,width:"100%",marginTop:4}}>✓ Guardar</button>
      </Modal>}
      {showGV&&<Modal onClose={()=>setShowGV(false)} titulo="🔧 Registrar Gasto Variable">
        <div style={{marginBottom:8}}><div style={LBL}>Concepto *</div><input value={formGV.concepto} onChange={e=>setFormGV(p=>({...p,concepto:e.target.value}))} placeholder="Reparación, gasolina, materiales..." style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:8}}><div style={LBL}>Categoría</div><select value={formGV.categoria} onChange={e=>setFormGV(p=>({...p,categoria:e.target.value}))} style={{...IS,width:"100%"}}>{[["reparacion","🔧 Reparación"],["transporte","🚗 Transporte"],["materiales","📦 Materiales"],["salario","👔 Personal"],["otros","📌 Otros"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        <div style={{marginBottom:8}}><div style={LBL}>Fecha</div><input type="date" value={formGV.fecha} onChange={e=>setFormGV(p=>({...p,fecha:e.target.value}))} style={{...IS,width:"100%"}}/></div>
        <div style={{marginBottom:8}}><div style={LBL}>Monto (Gs.) *</div><input type="number" value={formGV.monto} onChange={e=>setFormGV(p=>({...p,monto:e.target.value}))} style={{...IS,width:"100%",fontSize:15,fontWeight:700}}/></div>
        <button onClick={regGV} style={{...BTNP,width:"100%",marginTop:4}}>✓ Registrar</button>
      </Modal>}
    </div>
  );
}

function VistaCatalogo({productos,setProductos,notificar,alertas}) {
  const [showF,setShowF]=useState(false);const [edit,setEdit]=useState(null);const [filtRub,setFiltRub]=useState("Todos");const [buscar,setBuscar]=useState("");
  const [form,setForm]=useState({nombre:"",rubro:"Gaseosas",precio:"",costo:"",stock:"",stockMin:5,imagen:"🥤",disponible:true});
  const EMOJIS=["🥤","💧","🍺","🍊","🥭","⚡","🏃","🍵","🍕","🍔","🌮","🚬","🫗","🧋","🍶"];
  const rubros=["Todos",...RUBROS];
  const prods=productos.filter(p=>(filtRub==="Todos"||p.rubro===filtRub)&&p.nombre.toLowerCase().includes(buscar.toLowerCase()));
  const abrir=(p=null)=>{setEdit(p);setForm(p?{...p}:{nombre:"",rubro:"Gaseosas",precio:"",costo:"",stock:"",stockMin:5,imagen:"🥤",disponible:true});setShowF(true);};
  const guardar=()=>{if(!form.nombre||!form.precio){notificar("Campos requeridos","error");return;}const d={...form,precio:parseFloat(form.precio),costo:parseFloat(form.costo)||0,stock:parseInt(form.stock)||0,stockMin:parseInt(form.stockMin)||5,historialCompras:edit?.historialCompras||[]};if(edit)setProductos(p=>p.map(x=>x.id===edit.id?{...d,id:edit.id}:x));else setProductos(p=>[...p,{...d,id:Date.now()}]);notificar(edit?"Actualizado":"Agregado");setShowF(false);};
  return(
    <div style={{padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{fontSize:18,fontWeight:700}}>📦 Catálogo {alertas.length>0&&<span style={{fontSize:12,background:"#f59e0b",color:"#000",borderRadius:20,padding:"1px 8px",marginLeft:6}}>⚠ {alertas.length} bajo stock</span>}</h2>
        <button onClick={()=>abrir()} style={BTNP}>+ Agregar</button>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
        <input value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder="🔍 Buscar..." style={{...IS,width:200}}/>
        {rubros.slice(0,8).map(r=><button key={r} onClick={()=>setFiltRub(r)} style={{padding:"3px 9px",borderRadius:20,border:"1px solid",borderColor:filtRub===r?"#4f46e5":"#1e2840",background:filtRub===r?"#4f46e5":"transparent",color:filtRub===r?"#fff":"#9ca3af",fontSize:10,cursor:"pointer"}}>{r}</button>)}
      </div>
      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
          <thead><tr style={{background:"#0d1117"}}>
            {["","Producto","Rubro","Precio","PPP","Margen","Stock/Mín","IVA",""].map(h=><th key={h} style={{padding:"8px 11px",textAlign:"left",fontSize:10,color:"#6b7280",borderBottom:"1px solid #1e2840",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {prods.map(p=>{
              const ppp=calcPPP(p.historialCompras||[]);
              const margen=ppp>0?((p.precio-ppp)/ppp*100).toFixed(0):p.costo>0?((p.precio-p.costo)/p.costo*100).toFixed(0):null;
              const stockAlerta=p.stock<=p.stockMin;
              return(
                <tr key={p.id} style={{borderBottom:"1px solid #1e2840",opacity:p.disponible?1:0.5,background:stockAlerta?"#451a0305":"transparent"}}>
                  <td style={{padding:"8px 11px",fontSize:18}}>{p.imagen}</td>
                  <td style={{padding:"8px 11px",fontWeight:600,fontSize:12}}>{p.nombre}</td>
                  <td style={{padding:"8px 11px"}}><span style={{fontSize:9,padding:"2px 6px",borderRadius:20,background:"#1e2840",color:"#9ca3af"}}>{p.rubro}</span></td>
                  <td style={{padding:"8px 11px",fontWeight:700,color:"#818cf8",fontSize:12}}>{fmtGs(p.precio)}</td>
                  <td style={{padding:"8px 11px",fontSize:11,color:"#9ca3af"}}>{ppp?fmtGs(ppp):"—"}</td>
                  <td style={{padding:"8px 11px"}}>{margen&&<span style={{fontSize:11,fontWeight:600,color:Number(margen)>30?"#22c55e":Number(margen)>10?"#f59e0b":"#ef4444"}}>{margen}%</span>}</td>
                  <td style={{padding:"8px 11px"}}><span style={{fontSize:12,fontWeight:600,color:stockAlerta?"#f59e0b":"#e8eaf0"}}>{p.stock}</span><span style={{fontSize:9,color:"#6b7280"}}>/{p.stockMin}</span>{stockAlerta&&<span style={{fontSize:9,color:"#f59e0b",marginLeft:3}}>⚠</span>}</td>
                  <td style={{padding:"8px 11px",fontSize:10,color:"#f59e0b"}}>{fmtGs(ivaInc(p.precio).iva)}</td>
                  <td style={{padding:"8px 11px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>abrir(p)} style={{padding:"2px 7px",borderRadius:5,border:"none",background:"#1e3a5f",color:"#60a5fa",fontSize:10,cursor:"pointer"}}>✏</button>
                      <button onClick={()=>setProductos(p2=>p2.map(x=>x.id===p.id?{...x,disponible:!x.disponible}:x))} style={{padding:"2px 7px",borderRadius:5,border:"none",background:p.disponible?"#166534":"#374151",color:p.disponible?"#22c55e":"#9ca3af",fontSize:10,cursor:"pointer"}}>{p.disponible?"✓":"✗"}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showF&&<Modal onClose={()=>setShowF(false)} titulo={edit?"✏ Editar Producto":"➕ Nuevo Producto"}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{gridColumn:"1/-1"}}><div style={LBL}>Nombre *</div><input value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Rubro</div><select value={form.rubro} onChange={e=>setForm(p=>({...p,rubro:e.target.value}))} style={{...IS,width:"100%"}}>{RUBROS.map(r=><option key={r}>{r}</option>)}</select></div>
          <div><div style={LBL}>Ícono</div><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{EMOJIS.map(e=><button key={e} onClick={()=>setForm(p=>({...p,imagen:e}))} style={{width:30,height:30,borderRadius:6,border:`2px solid ${form.imagen===e?"#4f46e5":"#1e2840"}`,background:"transparent",fontSize:14,cursor:"pointer"}}>{e}</button>)}</div></div>
          <div><div style={LBL}>Precio venta (IVA inc.) *</div><input type="number" value={form.precio} onChange={e=>setForm(p=>({...p,precio:e.target.value}))} style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Costo</div><input type="number" value={form.costo} onChange={e=>setForm(p=>({...p,costo:e.target.value}))} style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Stock actual</div><input type="number" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))} style={{...IS,width:"100%"}}/></div>
          <div><div style={LBL}>Stock mínimo (alerta)</div><input type="number" value={form.stockMin} onChange={e=>setForm(p=>({...p,stockMin:e.target.value}))} style={{...IS,width:"100%"}}/></div>
          {form.precio&&form.costo&&<div style={{gridColumn:"1/-1",background:"#0d1117",borderRadius:7,padding:9,fontSize:11}}>
            <span style={{color:"#6b7280"}}>Margen: </span><span style={{color:"#22c55e",fontWeight:700}}>{(((parseFloat(form.precio)-parseFloat(form.costo))/parseFloat(form.costo))*100).toFixed(0)}%</span>
            <span style={{color:"#6b7280",marginLeft:12}}>IVA: </span><span style={{color:"#f59e0b"}}>{fmtGs(ivaInc(parseFloat(form.precio)).iva)}</span>
          </div>}
        </div>
        <button onClick={guardar} style={{...BTNP,width:"100%",marginTop:10}}>✓ {edit?"Guardar":"Agregar"}</button>
      </Modal>}
    </div>
  );
}

function VistaVentas({ventas,devoluciones,setDevoluciones,setVentas,setProductos,setCaja,notificar}) {
  const [sel,setSel]=useState(null);const [filtro,setFiltro]=useState("todas");
  const filtradas=ventas.filter(v=>filtro==="todas"||v.tipo===filtro);
  const totalV=ventas.reduce((s,v)=>s+v.total,0);
  const totalIva=ventas.reduce((s,v)=>s+(v.iva||0),0);
  const hoyV=ventas.filter(v=>new Date(v.fecha).toDateString()===new Date().toDateString());
  return(
    <div style={{padding:20}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:14}}>🧾 Historial de Ventas</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Total Ventas",v:fmtGs(totalV),c:"#818cf8"},{l:"IVA Total",v:fmtGs(totalIva),c:"#f59e0b"},{l:"Ventas Hoy",v:hoyV.length,c:"#22c55e"},{l:"Hoy Gs.",v:fmtGs(hoyV.reduce((s,v)=>s+v.total,0)),c:"#e8eaf0"}].map(({l,v,c})=>(
          <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:"12px 14px"}}><div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:"flex",gap:5,marginBottom:11,flexWrap:"wrap"}}>
        {[["todas","Todas"],["mostrador","Mostrador"],["llevar","Llevar"],["delivery","Delivery"],["consignacion","Consignación"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltro(v)} style={{padding:"3px 11px",borderRadius:20,border:"1px solid",borderColor:filtro===v?"#4f46e5":"#1e2840",background:filtro===v?"#4f46e5":"transparent",color:filtro===v?"#fff":"#9ca3af",fontSize:11,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,overflow:"auto"}}>
        {filtradas.length===0?<div style={{textAlign:"center",padding:28,color:"#6b7280"}}>Sin ventas</div>:(
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr style={{background:"#0d1117"}}>
              {["#","Fecha","Cliente","Tipo","Total","IVA","Pago","Usuario",""].map(h=><th key={h} style={{padding:"8px 11px",textAlign:"left",fontSize:10,color:"#6b7280",borderBottom:"1px solid #1e2840"}}>{h}</th>)}
            </tr></thead>
            <tbody>{filtradas.map(v=>(
              <tr key={v.id} style={{borderBottom:"1px solid #1e2840"}}>
                <td style={{padding:"8px 11px",fontSize:10,color:"#6b7280",fontFamily:"monospace"}}>#{v.id.slice(-6).toUpperCase()}</td>
                <td style={{padding:"8px 11px",fontSize:11}}>{fmtFec(v.fecha)}</td>
                <td style={{padding:"8px 11px",fontSize:11}}>{v.cliente?.nombre||"—"}</td>
                <td style={{padding:"8px 11px"}}><span style={{fontSize:9,padding:"2px 6px",borderRadius:20,background:"#1e2840",color:"#9ca3af"}}>{v.tipo}</span></td>
                <td style={{padding:"8px 11px",fontWeight:700,color:"#818cf8",fontSize:12}}>{fmtGs(v.total)}</td>
                <td style={{padding:"8px 11px",fontSize:10,color:"#f59e0b"}}>{fmtGs(v.iva||0)}</td>
                <td style={{padding:"8px 11px",fontSize:11}}>{v.metodoPago}</td>
                <td style={{padding:"8px 11px",fontSize:10,color:"#6b7280"}}>{v.usuario||"—"}</td>
                <td style={{padding:"8px 11px"}}><button onClick={()=>setSel(v)} style={{padding:"2px 8px",borderRadius:5,border:"none",background:"#1e2840",color:"#9ca3af",fontSize:10,cursor:"pointer"}}>🧾</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {sel&&<TicketModal venta={sel} onClose={()=>setSel(null)}/>}
    </div>
  );
}

function VistaFinanzas({ventas,compras,devoluciones,productos,caja,saldoCaja,gastosFijos,gastosVar,funcionarios,consignaciones}) {
  const totalV=ventas.reduce((s,v)=>s+v.total,0);
  const totalIva=ventas.reduce((s,v)=>s+(v.iva||0),0);
  const totalDev=devoluciones.reduce((s,d)=>s+d.total,0);
  const totalComp=compras.reduce((s,c)=>s+c.total,0);
  const totalCosto=ventas.reduce((s,v)=>s+v.items.reduce((ss,i)=>ss+(i.costo||0)*i.cantidad,0),0);
  const totalGF=gastosFijos.filter(g=>g.activo).reduce((s,g)=>s+g.monto,0);
  const totalGV=gastosVar.reduce((s,g)=>s+g.monto,0);
  const totalSal=funcionarios.filter(f=>f.activo).reduce((s,f)=>s+f.salario,0);
  const ganB=totalV-totalDev-totalCosto;
  const utilN=ganB-totalGF-totalGV;
  const consignP=consignaciones.filter(c=>c.estado==="pendiente_cobro").reduce((s,c)=>s+c.total,0);
  const top={};ventas.forEach(v=>v.items.forEach(i=>{if(!top[i.nombre])top[i.nombre]={cant:0,total:0,img:i.imagen};top[i.nombre].cant+=i.cantidad;top[i.nombre].total+=i.precio*i.cantidad;}));
  const topArr=Object.entries(top).sort((a,b)=>b[1].cant-a[1].cant).slice(0,6);
  return(
    <div style={{padding:20}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>📈 Finanzas & Reportes</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[{l:"Ingresos Brutos",v:fmtGs(totalV),c:"#818cf8",s:`${ventas.length} ventas`},{l:"Devoluciones",v:fmtGs(totalDev),c:"#ef4444",s:`${devoluciones.length}`},{l:"Ganancia Bruta",v:fmtGs(ganB),c:"#22c55e",s:totalV>0?`${((ganB/totalV)*100).toFixed(1)}% margen`:""},,{l:"Utilidad Neta",v:fmtGs(utilN),c:utilN>=0?"#22c55e":"#ef4444",s:"- gastos"}].filter(Boolean).map(({l,v,c,s})=>(
          <div key={l} style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:"13px 14px"}}><div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>{l}</div><div style={{fontSize:17,fontWeight:700,color:c,marginBottom:2}}>{v}</div><div style={{fontSize:10,color:"#6b7280"}}>{s}</div></div>
        ))}
      </div>
      {/* IVA */}
      <div style={{background:"#1c1500",border:"1px solid #92400e",borderRadius:10,padding:"13px 15px",marginBottom:14,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{l:"Base Imponible",v:fmtGs(totalV-totalIva),c:"#fbbf24"},{l:"IVA Recaudado 10%",v:fmtGs(totalIva),c:"#f59e0b"},{l:"IVA Devoluciones",v:fmtGs(devoluciones.reduce((s,d)=>s+(d.iva||0),0)),c:"#ef4444"},{l:"IVA Neto a pagar",v:fmtGs(totalIva-devoluciones.reduce((s,d)=>s+(d.iva||0),0)),c:"#22c55e"}].map(({l,v,c})=>(
          <div key={l}><div style={{fontSize:9,color:"#a16207",marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:14}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:11}}>💸 Resumen</div>
          {[["Compras registradas",fmtGs(totalComp),"#f59e0b"],["Costo mercadería vendida",fmtGs(totalCosto),"#f97316"],["Gastos fijos (est./mes)",fmtGs(totalGF),"#ef4444"],["Gastos variables",fmtGs(totalGV),"#ef4444"],["Salarios (est./mes)",fmtGs(totalSal),"#818cf8"],["Consignaciones pendientes",fmtGs(consignP),"#f59e0b"]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1e2840",fontSize:12}}><span style={{color:"#9ca3af"}}>{l}</span><span style={{fontWeight:600,color:c}}>{v}</span></div>
          ))}
          <div style={{marginTop:10,padding:"11px",background:"#0d1117",borderRadius:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:15}}><span>UTILIDAD NETA</span><span style={{color:utilN>=0?"#22c55e":"#ef4444"}}>{fmtGs(utilN)}</span></div>
        </div>
        <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:10,padding:14}}>
          <div style={{fontWeight:600,fontSize:13,marginBottom:11}}>🏆 Más vendidos</div>
          {topArr.length===0?<div style={{color:"#6b7280",fontSize:12}}>Sin datos</div>:topArr.map(([n,d],i)=>(
            <div key={n} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
              <span style={{fontSize:10,color:"#6b7280",minWidth:14}}>#{i+1}</span>
              <span style={{fontSize:15}}>{d.img}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{n}</div>
                <div style={{width:"100%",height:4,background:"#1e2840",borderRadius:4}}><div style={{width:`${(d.cant/topArr[0][1].cant)*100}%`,height:"100%",background:"#4f46e5",borderRadius:4}}/></div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:700,color:"#818cf8"}}>{d.cant}u</div><div style={{fontSize:9,color:"#6b7280"}}>{fmtGs(d.total)}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TICKET
// ══════════════════════════════════════════════════════════════
function TicketModal({venta,onClose}) {
  const ref=useRef();
  const imprimir=()=>{const w=window.open("","_blank","width=400,height=660");const css=`body{font-family:monospace;font-size:12px;margin:0;padding:12px;width:360px;color:#000}.row{display:flex;justify-content:space-between}.muted{color:#555}`;w.document.write(`<html><head><title>Ticket</title><style>${css}</style></head><body>${ref.current.innerHTML}</body></html>`);w.document.close();w.print();};
  return(
    <Modal onClose={onClose} titulo="🧾 Comprobante">
      <div ref={ref} style={{fontFamily:"monospace",fontSize:12,lineHeight:1.9}}>
        <div style={{textAlign:"center",marginBottom:9}}>
          <div style={{fontSize:20}}>🥤</div>
          <div style={{fontWeight:700,fontSize:14}}>BEBIDAS EXPRESS</div>
          <div style={{fontSize:10,color:"#9ca3af"}}>Ciudad del Este, Paraguay · RUC: 80XXXXXX-X</div>
        </div>
        <div style={{borderTop:"1px dashed #374151",borderBottom:"1px dashed #374151",padding:"6px 0",margin:"7px 0",fontSize:11}}>
          {[["Ticket",`#${venta.id.slice(-8).toUpperCase()}`],["Fecha",fmtFec(venta.fecha)],["Cliente",venta.cliente?.nombre||"Consumidor Final"],["Tipo",venta.tipo],["Pago",venta.metodoPago],["Cajero",venta.usuario||"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#9ca3af"}}>{k}</span><span>{v}</span></div>
          ))}
        </div>
        <div style={{marginBottom:7,fontSize:11}}>
          {venta.items?.map((i,idx)=>(
            <div key={idx}>
              <div>{i.nombre}</div>
              <div style={{display:"flex",justifyContent:"space-between",color:"#9ca3af",paddingLeft:8}}>
                <span>{i.cantidad} x {fmtGs(i.precio)}{i.descuento>0?` (−${i.descuento}%)`:""}</span>
                <span style={{color:"#e8eaf0"}}>{fmtGs(i.precio*(1-(i.descuento||0)/100)*i.cantidad)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px dashed #374151",paddingTop:6,fontSize:11}}>
          <div style={{display:"flex",justifyContent:"space-between",color:"#9ca3af"}}><span>Base imponible</span><span>{fmtGs(venta.base||0)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",color:"#f59e0b"}}><span>IVA 10%</span><span>{fmtGs(venta.iva||0)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14,marginTop:4,color:"#818cf8"}}><span>TOTAL</span><span>{fmtGs(venta.total)}</span></div>
          {venta.metodoPago==="efectivo"&&venta.montoRecibido>venta.total&&<>
            <div style={{display:"flex",justifyContent:"space-between",color:"#9ca3af",fontSize:10}}><span>Recibido</span><span>{fmtGs(venta.montoRecibido)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#22c55e",fontWeight:600}}><span>Cambio</span><span>{fmtGs(venta.cambio)}</span></div>
          </>}
        </div>
        <div style={{textAlign:"center",marginTop:10,fontSize:9,color:"#6b7280",borderTop:"1px dashed #374151",paddingTop:6}}>Documento no válido como factura legal<br/>¡Gracias por su compra! 🙏</div>
      </div>
      <button onClick={imprimir} style={{width:"100%",marginTop:11,padding:10,borderRadius:8,border:"none",background:"#166534",color:"#22c55e",fontWeight:700,cursor:"pointer",fontSize:12}}>🖨️ IMPRIMIR TICKET</button>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════
//  SHARED
// ══════════════════════════════════════════════════════════════
function Modal({onClose,titulo,children}) {
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:14}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#111827",border:"1px solid #1e2840",borderRadius:14,padding:20,width:"100%",maxWidth:520,maxHeight:"88vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14}}>{titulo}</div>
          <button onClick={onClose} style={{width:26,height:26,borderRadius:6,border:"none",background:"#1e2840",color:"#9ca3af",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
const IS  ={padding:"7px 10px",borderRadius:7,border:"1px solid #1e2840",background:"#0d1117",color:"#e8eaf0",fontSize:12,boxSizing:"border-box"};
const LBL ={display:"block",fontSize:10,color:"#6b7280",marginBottom:3,fontWeight:600,letterSpacing:"0.04em"};
const BS  ={width:22,height:22,borderRadius:5,border:"none",background:"#1e2840",color:"#e8eaf0",cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"};
const BTNP={padding:"7px 14px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",color:"#fff"};
