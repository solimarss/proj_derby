package proj_derby;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public abstract class GenericDao {
	private Connection connection;

	protected GenericDao() throws ClassNotFoundException, SQLException {
		this.connection = ConnectionDataBase.getConnection();
	}

	protected Connection getConnection() {
		return connection;
	}

	protected void save(String insertSql, Object... parametros) {
		try {
			PreparedStatement pstmt = getConnection().prepareStatement(insertSql);

			for (int i = 0; i < parametros.length; i++) {
				pstmt.setObject(i + 1, parametros[i]);
			}

			pstmt.execute();
			pstmt.close();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		}
	}

	protected void update(String updateSql, Object... parametros) {
		try {
			PreparedStatement pstmt = connection.prepareStatement(updateSql);

			for (int i = 0; i < parametros.length; i++) {
				pstmt.setObject(i + 1, parametros[i]);
			}

			pstmt.execute();
			pstmt.close();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		}
	}

	protected void delete(String deleteSql, Object... parametros) {
		try {
			PreparedStatement pstmt = getConnection().prepareStatement(deleteSql);

			for (int i = 0; i < parametros.length; i++) {
				pstmt.setObject(i + 1, parametros[i]);
			}

			pstmt.execute();
			pstmt.close();
		} catch (SQLException e) {
			throw new RuntimeException(e);
		}
	}

	protected void shutdown() throws SQLException {
		getConnection().createStatement().executeUpdate("SHUTDOWN");
	}
}