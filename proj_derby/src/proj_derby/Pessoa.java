package proj_derby;

public class Pessoa {
	private Integer id;
	private String nome;
	private int idade;

	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public int getIdade() {
		return idade;
	}

	public void setIdade(int idade) {
		this.idade = idade;
	}

	@Override
	public String toString() {
		return "Pessoa{" + "id=" + id + ", nome='" + nome + '\'' + ", idade=" + idade + '}';
	}
}
