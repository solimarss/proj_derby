package proj_derby;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConnectionDataBase {

	private static final String USER = "root";
	private static final String PASS = "123";
	private static final String URL = "jdbc:derby:myDerby;create=true;user=" + USER + ";password=" + PASS;
	private static final String DRIVER = "org.apache.derby.jdbc.EmbeddedDriver";

	public static Connection getConnection() throws ClassNotFoundException, SQLException {
		System.out.println("Conectando ao Banco de Dados");
		Class.forName(DRIVER);
		return DriverManager.getConnection(URL);

	}
}
