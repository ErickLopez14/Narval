parasails.registerPage('inventario', {
  //  ╦╔╗╔╦╔╦╗╦╔═╗╦    ╔═╗╔╦╗╔═╗╔╦╗╔═╗
  //  ║║║║║ ║ ║╠═╣║    ╚═╗ ║ ╠═╣ ║ ║╣
  //  ╩╝╚╝╩ ╩ ╩╩ ╩╩═╝  ╚═╝ ╩ ╩ ╩ ╩ ╚═╝
  data: {
    //…
    o_articulo: {},
    l_verModalActualizar: false,
    l_verModalAgregar: false,
    l_verModalEliminar: false,
    l_buscarArticulo: '',
    l_filtro: {},
    l_masDanado: 0,
    l_masArticulos: 0,
  },

  //  ╦  ╦╔═╗╔═╗╔═╗╦ ╦╔═╗╦  ╔═╗
  //  ║  ║╠╣ ║╣ ║  ╚╦╝║  ║  ║╣
  //  ╩═╝╩╚  ╚═╝╚═╝ ╩ ╚═╝╩═╝╚═╝
  beforeMount: function () {
    // Attach any initial data from the server.
    _.extend(this, SAILS_LOCALS);
    //this.modeloI.articulos= Cloud.extraerInventario();
  },
  mounted: async function () {
      //…
    },

    //  ╦╔╗╔╔╦╗╔═╗╦═╗╔═╗╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ║║║║ ║ ║╣ ╠╦╝╠═╣║   ║ ║║ ║║║║╚═╗
    //  ╩╝╚╝ ╩ ╚═╝╩╚═╩ ╩╚═╝ ╩ ╩╚═╝╝╚╝╚═╝
    methods: {
      cerrarModalActualizar: async function () {
          this.l_verModalActualizar = false;
          this.o_articulo = {};
        },
        cerrarModalEliminar: async function () {
            this.l_verModalEliminar = false;
            this.o_articulo = {};
          },
          cerrarNuevo: async function () {
              this.l_verModalAgregar = false;
              this.o_articulo = {};
            },
            verModalActualizar: async function (p_articulo) {
                Object.assign(this.o_articulo, p_articulo);
                this.l_verModalActualizar = true;
              },
              verModalAgregar: async function () {
                  this.l_verModalAgregar = true;
                },
                verModalEliminar: async function (p_articulo) {
                    this.o_articulo = p_articulo;
                    this.l_verModalEliminar = true;
                  },
                  crearArticulo: async function (articuloNuevo) {
                      this.o_articulo.cantidadLibre = this.o_articulo.cantidadTotal;
                      this.o_articulo.cantidadDanado = 0;
                      this.o_articulo.cantidadUso = 0;
                      this.o_articulo.cantidadReservado = 0;
                      await Cloud.insertarUnArticulo.with(articuloNuevo);
                      this.articuloNuevo = {};
                      this.modelo.articulos.push(articuloNuevo);
                      this.cerrarNuevo();
                      this.$forceUpdate();
                    },
                    eliminarUnArticulo: async function () {
                        await Cloud.eliminarUnArticulo.with(this.o_articulo);
                        this.modelo.articulos.splice(this.modelo.articulos.indexOf(this.o_articulo), 1);
                        this.cerrarModalEliminar();
                        this.$forceUpdate();
                      },
                      actualizarUnArticulo: async function (p_articulo) {
                        await Cloud.actualizarUnArticulo.with(this.o_articulo);
                        this.modelo.articulos = this.modelo.articulos.map(articulo => {
                          if (articulo.id === this.o_articulo.id) {
                            articulo = this.o_articulo;
                          }
                          return articulo;
                        });
                        this.cerrarModalActualizar();
                        this.$forceUpdate();
                      },
    },
    filters: {
      formatoMoneda: function (cantidad) {
        if (typeof cantidad !== 'number') {
          return cantidad;
        }

        let formato = Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        });
        return formato.format(cantidad);
      },
    },
    computed: {
      filtroCategorias: function () {
        let l_bandera = false;
        let a_arregloCategoria = [];
        this.filtroArticulos.forEach(element => {
          if (a_arregloCategoria.length === 0) {
            a_arregloCategoria.push(element.categoria);
          } else {
            for (let index = 0; index < a_arregloCategoria.length; index++) {
              if (a_arregloCategoria[index] === element.categoria) {
                l_bandera = true;
                index = a_arregloCategoria.length + 1;
              }
            }
            if (l_bandera === false) {
              a_arregloCategoria.push(element.categoria);
            }
            l_bandera = false;
          }
        });
        return a_arregloCategoria;
      },
      filtroArticulos: function () {

        /*
         * Función para limpiar el filtro a usar, en caso de que el atributo este vacío
         * eliminamos ese atributo del objeto para que no sea evaluado
         */
        const c_limpiaFiltro = objeto => {
          for (let t_atributo in objeto)
            if (objeto[t_atributo] === null || objeto[t_atributo] === undefined || objeto[t_atributo] === '')
              delete objeto[t_atributo];
          return objeto;
        }

        /*
         * Filtramos las articulos que cumplan con el filtro preestablecido por el usuario y que cumpla con
         * que la barra de búsqueda tenga más de un dígito y coincida con la descripción o ubicación.
         */
        if (this.l_buscarArticulo.length > 3) {
          return _.filter(this.modelo.articulos, c_limpiaFiltro(this.l_filtro))
            .filter(articulo => articulo.descripcion.includes(this.l_buscarArticulo) || articulo.categoria.includes(this.l_buscarArticulo) || articulo.id.includes(this.l_buscarArticulo));
        } else if (this.l_buscarArticulo === "*") {
          return this.modelo.articulos;
        } else {
          return new Array();
        }
      }
    },
    watch: {
      l_masDanado(valNew, valOld) {
        /* Esta variable resibe el filtro del articulo del modelo que es 
                igual a el que se utiliza en cada actualizar*/
        let l_cantidadLibre = _.find(this.modelo.articulos, {
          id: this.o_articulo.id
        }).cantidadLibre;
        /* esta varible resive la cantidad danado del articulo del modelo que 
        es igual aal que utiliza en cada actualizar*/
        let l_cantidadDanado = _.find(this.modelo.articulos, {
          id: this.o_articulo.id
        }).cantidadDanado;
        /* Esta variable parsea el valor del input de el modal actualizar*/
        let l_numMasDanado = parseInt(this.l_masDanado);

        if (this.l_masDanado && l_numMasDanado <= l_cantidadLibre) {
          this.o_articulo.cantidadLibre = l_cantidadLibre - l_numMasDanado + parseInt(this.l_masArticulos);
          this.o_articulo.cantidadDanado = l_numMasDanado + l_cantidadDanado;
        } else {
          this.o_articulo.cantidadLibre = l_cantidadLibre;
        }
      },
      l_masArticulos() {
        /* Esta variable resibe el filtro del articulo del modelo que es 
        igual a el que se utiliza en cada acctualizar*/
        let l_cantidadTotal = _.find(this.modelo.articulos, {
          id: this.o_articulo.id
        }).cantidadTotal;
        /* Esta variable resibe el filtro del articulo del modelo que es 
                igual a el que se utiliza en cada acctualizar*/
        let l_cantidadLibre = _.find(this.modelo.articulos, {
          id: this.o_articulo.id
        }).cantidadLibre;
        /* esta varible resive la cantidad danado del articulo del modelo que 
        es igual aal que utiliza en cada actualizar*/
        let l_cantidadDanado = _.find(this.modelo.articulos, {
          id: this.o_articulo.id
        }).cantidadDanado;
        /* Esta variable parsea el valor del input de el modal actualizar*/
        let l_numMasArticulos = parseInt(this.l_masArticulos)

        if (this.l_masArticulos) {
          this.o_articulo.cantidadTotal = l_cantidadTotal + l_numMasArticulos;
          this.o_articulo.cantidadLibre = l_numMasArticulos + l_cantidadTotal - parseInt(this.l_masDanado) - l_cantidadDanado;
        } else {
          this.o_articulo.cantidadTotal = l_cantidadTotal;
          this.o_articulo.cantidadLibre = l_cantidadLibre;
        }
      }

    }

});
