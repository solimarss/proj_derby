package proj_derby;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PessoaDao extends GenericDao {

	protected PessoaDao() throws ClassNotFoundException, SQLException {
		
	}

	public void save(Pessoa pessoa) {
		String sql = "INSERT INTO PESSOAS(nome, idade) VALUES (?,?)";
		save(sql, pessoa.getNome(), pessoa.getIdade());
	}

	public void update(Pessoa pessoa) {
		String sql = "UPDATE PESSOAS " + "SET nome = ?, idade = ? " + "where id_pessoa = ?";
		update(sql, pessoa.getNome(), pessoa.getIdade(), pessoa.getId());
	}

	public void delete(Pessoa pessoa) {
		String sql = "DELETE FROM PESSOAS WHERE id_pessoa = ? ";
		delete(sql, pessoa.getId());
	}

	public List<Pessoa> findPessoas() {
		List<Pessoa> pessoas = new ArrayList<Pessoa>();
		String sql = "SELECT * FROM PESSOAS";
		try {
			PreparedStatement pstmt = getConnection().prepareStatement(sql);

			ResultSet rs = pstmt.executeQuery();

			while (rs.next()) {
				Pessoa pessoa = new Pessoa();
				pessoa.setId(rs.getInt("id_pessoa"));
				pessoa.setNome(rs.getString("nome"));
				pessoa.setIdade(rs.getInt("idade"));
				pessoas.add(pessoa);
			}
			rs.close();
			pstmt.close();
			return pessoas;
		} catch (SQLException e) {
			e.printStackTrace();
		}
		return null;
	}
}