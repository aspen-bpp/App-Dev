from app import ssh_login, convert_to_mb, processing_data
from unittest.mock import MagicMock, patch
import pandas as pd

def test_ssh_login():
    fake_stdout = MagicMock()
    fake_stdout.read.return_value = b"Filesystem Size Used Avail Use% Mounted on\n/dev/xvda1 20G 10G 10G 50% /\n"
    fake_stderr = MagicMock()
    fake_stderr.read.return_value = b""

    fake_client = MagicMock()
    fake_client.exec_command.return_value = (None, fake_stdout, fake_stderr)

    with patch("paramiko.SSHClient", return_value=fake_client):
        ok, out = ssh_login("user", "pass", "1.2.3.4")

    assert ok is True
    assert "Filesystem" in out
    fake_client.connect.assert_called_once_with("1.2.3.4", username="user", password="pass")
    fake_client.close.assert_called_once()

def test_convert_to_mb_G():
    val = convert_to_mb("10G")
    assert val == 10000

def test_convert_to_mb_M():
    val = convert_to_mb("10M")
    assert val == 10

def test_convert_to_mb_K():
    val = convert_to_mb("10K")
    assert val == 0.01

def test_convert_to_mb_T():
    val = convert_to_mb("10T")
    assert val == 10000000

def test_processing_data():
    test_data = """Filesystem                                                                                                                         Size  Used Avail Use% Mounted on
    devtmpfs                                                                                                                            32G     0   32G   0% /dev
    tmpfs                                                                                                                               32G   64K   32G   1% /dev/shm
    tmpfs                                                                                                                               32G  3.2G   29G  11% /run
    tmpfs                                                                                                                               32G     0   32G   0% /sys/fs/cgroup
    /dev/nvme0n1p3                                                                                                                     250G   22G  228G   9% /
    /dev/nvme0n1p2                                                                                                                     507M  386M  122M  77% /boot
    /dev/nvme0n1p1                                                                                                                     200M  6.7M  194M   4% /boot/efi
    svm-020d354219b636ee0.fs-0ebbf56e519490acd.fsx.eu-west-1.amazonaws.com:/cluster/cluster                                            1.0T   21G 1004G   3% /arm/cluster
    tmpfs                                                                                                                              6.3G  448K  6.3G   1% /run/user/42
    svm-020d354219b636ee0.fs-0ebbf56e519490acd.fsx.eu-west-1.amazonaws.com:/home/home/clasci01                                          20G   14G  6.5G  68% /home/clasci01
    tmpfs                                                                                                                              6.3G  448K  6.3G   1% /run/user/30393
"""
    pie, table = processing_data(test_data)
    # Testing if pie chart is created
    assert pie is not None
    # Testing if table is created and is a pandas dataframe
    assert table is not None
    assert isinstance(table, pd.DataFrame)
    # Testing if columns are as expected 
    assert "Filesystem" in table.columns
    assert "Usage(%)" in table.columns
    # Testing if table is sorted descending
    assert table["Usage(%)"].is_monotonic_decreasing


