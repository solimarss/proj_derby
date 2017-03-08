package proj_derby;

import java.sql.SQLException;
import java.util.List;

import javax.swing.JOptionPane;

public class DerbyTest {
	public static void main(String[] args) {
		try {
			criarTabelas();
			inserirPessoas();
			listarPessoas();
			JOptionPane.showMessageDialog(null, "OK2");
		} catch (ClassNotFoundException | SQLException e) {
			JOptionPane.showMessageDialog(null, e);
			e.printStackTrace();
		}
		
	}

	
	private static void criarTabelas() throws ClassNotFoundException, SQLException {
		new CreateTables().createTablePessoas();
		new CreateTables().createTableTelefones();
	}

	private static void inserirPessoas() throws ClassNotFoundException, SQLException {
		PessoaDao dao = new PessoaDao();

		Pessoa p1 = new Pessoa();
		p1.setNome("Ana Maria");
		p1.setIdade(65);
		dao.save(p1);

		Pessoa p2 = new Pessoa();
		p2.setNome("Simão Pedro");
		p2.setIdade(40);
		dao.save(p2);

		// crie quantos mais desejar
	}

	private static void listarPessoas() throws ClassNotFoundException, SQLException {
		List<Pessoa> pessoas = new PessoaDao().findPessoas();
		for (Pessoa pessoa : pessoas) {
			System.out.println("Derby.............:\n" + pessoa.toString());
		}
	}
}