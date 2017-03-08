package proj_derby;

public class Telefone {
	private Integer id;
	private String numero;
	private String tipo;
	private int idPessoa;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getNumero() {
		return numero;
	}

	public void setNumero(String numero) {
		this.numero = numero;
	}

	public String getTipo() {
		return tipo;
	}

	public void setTipo(String tipo) {
		this.tipo = tipo;
	}

	public int getIdPessoa() {
		return idPessoa;
	}

	public void setIdPessoa(int idPessoa) {
		this.idPessoa = idPessoa;
	}

	@Override
	public String toString() {
		return "Telefone{" + "id=" + id + ", numero='" + numero + '\'' + ", tipo='" + tipo + '\'' + ", idPessoa="
				+ idPessoa + '}';
	}

	public enum TipoFone {
		CEL(0, "Celular"), RES(1, "Residencial"), COM(2, "Comercial");

		private int indice;
		private String descricao;

		TipoFone(int indice, String descricao) {
			this.indice = indice;
			this.descricao = descricao;
		}

		public int getIndice() {
			return indice;
		}

		public String getDescricao() {
			return descricao;
		}
	}
}
